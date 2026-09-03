"""Tests for the live refresher's file I/O.

The refresher rewrites seven files every five minutes while a FastAPI server
reads them, so the properties asserted here are the ones that keep that safe:
a swap is atomic, a serialisation failure never damages the good file, an
unchanged payload is not rewritten at all, and a reader running concurrently
with a writer never sees a torn file. The concurrency test in particular is
the one that catches a missing Windows retry -- it passes trivially on POSIX.
"""

import json
import threading
import time

import pytest

from heatstress import live


class TestPayloadContract:
    def test_keys_match_the_api_contract(self):
        """These names are the seam between the engine, the files and the API."""
        assert set(live.PAYLOAD_FILES) == {
            "map", "hourly", "summary", "personas", "advisory", "insights", "meta",
        }

    def test_filenames_match_what_the_frontend_and_ci_expect(self):
        assert set(live.PAYLOAD_FILES.values()) == {
            "hexes.geojson", "hourly.json", "city.json", "personas.json",
            "advisory.json", "insights.json", "meta.json",
        }

    def test_the_two_non_obvious_mappings(self):
        # map->hexes and summary->city are the ones a rename breaks silently.
        assert live.PAYLOAD_FILES["map"] == "hexes.geojson"
        assert live.PAYLOAD_FILES["summary"] == "city.json"


class TestAtomicWrite:
    def test_creates_and_then_replaces(self, tmp_path):
        path = tmp_path / "x.json"
        assert live.atomic_write_json(path, {"v": 1}) is True
        assert json.loads(path.read_text()) == {"v": 1}
        assert live.atomic_write_json(path, {"v": 2}) is True
        assert json.loads(path.read_text()) == {"v": 2}

    def test_leaves_no_temp_files(self, tmp_path):
        path = tmp_path / "x.json"
        for i in range(5):
            live.atomic_write_json(path, {"v": i})
        assert list(tmp_path.glob("*.tmp")) == []
        assert list(tmp_path.glob(".*")) == []

    def test_identical_payload_is_not_rewritten(self, tmp_path):
        path = tmp_path / "x.json"
        live.atomic_write_json(path, {"v": 1})
        before = path.stat().st_mtime_ns
        time.sleep(0.01)
        assert live.atomic_write_json(path, {"v": 1}) is False
        assert path.stat().st_mtime_ns == before

    def test_skip_can_be_disabled(self, tmp_path):
        path = tmp_path / "x.json"
        live.atomic_write_json(path, {"v": 1})
        assert live.atomic_write_json(path, {"v": 1}, skip_if_unchanged=False) is True

    def test_serialisation_failure_does_not_clobber_the_good_file(self, tmp_path):
        """The whole reason the payload is serialised before opening anything.

        A compute bug that emits an unserialisable value must not be able to
        leave `web/data/live/` half written.
        """
        path = tmp_path / "x.json"
        live.atomic_write_json(path, {"ok": 1})
        with pytest.raises(TypeError):
            live.atomic_write_json(path, {"bad": object()})
        assert json.loads(path.read_text()) == {"ok": 1}
        assert list(tmp_path.glob("*.tmp")) == []

    def test_creates_missing_parent_directories(self, tmp_path):
        path = tmp_path / "deep" / "nested" / "x.json"
        live.atomic_write_json(path, {"v": 1})
        assert json.loads(path.read_text()) == {"v": 1}


class TestWritePayload:
    def _payload(self):
        return {key: {"key": key} for key in live.PAYLOAD_FILES}

    def test_writes_every_file(self, tmp_path):
        live.write_payload(self._payload(), tmp_path)
        for name in live.PAYLOAD_FILES.values():
            assert (tmp_path / name).exists()

    def test_meta_is_written_last(self, tmp_path, monkeypatch):
        """meta is the commit point: a torn read should be new map, old meta."""
        order = []
        real = live.atomic_write_json

        def spy(path, payload, **kw):
            order.append(path.name)
            return real(path, payload, **kw)

        monkeypatch.setattr(live, "atomic_write_json", spy)
        live.write_payload(self._payload(), tmp_path)
        assert order[-1] == "meta.json"
        assert len(order) == len(live.PAYLOAD_FILES)

    def test_round_trips_through_read_payload(self, tmp_path):
        payload = self._payload()
        live.write_payload(payload, tmp_path)
        assert live.read_payload(tmp_path) == payload

    def test_reports_which_files_changed(self, tmp_path):
        payload = self._payload()
        first = live.write_payload(payload, tmp_path)
        assert all(first.values())
        second = live.write_payload(payload, tmp_path)
        assert not any(second.values())


class TestConcurrentReadWrite:
    def test_a_reader_never_sees_a_torn_file(self, tmp_path):
        """Replace a file in a tight loop while reading it a few hundred times.

        On Windows os.replace can fail against an open handle, and an unguarded
        reader can catch the delete-pending window. Both sides retry; neither
        should ever surface an error or a partial parse.
        """
        path = tmp_path / "x.json"
        a = {"which": "a", "pad": "x" * 20000}
        b = {"which": "b", "pad": "y" * 20000}
        live.atomic_write_json(path, a)

        stop = threading.Event()
        errors = []

        def writer():
            i = 0
            while not stop.is_set():
                try:
                    live.atomic_write_json(path, a if i % 2 else b,
                                           skip_if_unchanged=False)
                except Exception as exc:          # pragma: no cover
                    errors.append(exc)
                i += 1

        thread = threading.Thread(target=writer, daemon=True)
        thread.start()
        try:
            seen = set()
            for _ in range(300):
                seen.add(live.read_json_retry(path)["which"])
        finally:
            stop.set()
            thread.join(timeout=5)

        assert not errors, f"writer raised: {errors[:3]}"
        assert seen <= {"a", "b"}

    def test_read_json_retry_raises_when_the_file_is_really_absent(self, tmp_path):
        with pytest.raises(FileNotFoundError):
            live.read_json_retry(tmp_path / "nope.json", attempts=2, delay=0.001)
