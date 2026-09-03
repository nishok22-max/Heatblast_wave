"""Tests for the single-instance refresh lock.

The lock exists so the API loop and the standalone scheduler can both run
without computing twice or interleaving writes. It is a listening socket rather
than a PID file specifically so that a crashed holder releases it -- the last
test here is the one that justifies that choice, and it is the reason not to
"simplify" this back to a file later.
"""

import subprocess
import sys
import textwrap

import pytest

from heatstress import live

# A port of its own, so a scheduler running on the default does not make the
# suite flaky.
PORT = 47653


class TestSingleInstance:
    def test_is_exclusive_while_held(self):
        with live.single_instance(PORT):
            with pytest.raises(live.RefreshBusy):
                with live.single_instance(PORT):
                    pass                          # pragma: no cover

    def test_releases_on_normal_exit(self):
        with live.single_instance(PORT):
            pass
        with live.single_instance(PORT):
            pass

    def test_releases_when_the_body_raises(self):
        with pytest.raises(ValueError):
            with live.single_instance(PORT):
                raise ValueError("boom")
        with live.single_instance(PORT):
            pass

    def test_different_ports_do_not_contend(self):
        with live.single_instance(PORT):
            with live.single_instance(PORT + 1):
                pass

    def test_wait_gives_up_and_reports_the_port(self):
        with live.single_instance(PORT):
            with pytest.raises(live.RefreshBusy, match=str(PORT)):
                with live.single_instance(PORT, wait=0.1):
                    pass                          # pragma: no cover

    def test_survives_the_holder_being_killed(self):
        """The whole argument for a socket over a PID file.

        A PID file would still be on disk here and would need a liveness probe
        to clear -- and the usual probe, os.kill(pid, 0), terminates the target
        on Windows. The kernel reclaims a socket however the process dies, so
        there is no stale-lock case to reason about at all.
        """
        code = textwrap.dedent(f"""
            import os, sys
            sys.path.insert(0, {str(live.ROOT / "src")!r})
            from heatstress import live
            cm = live.single_instance({PORT})
            cm.__enter__()
            os._exit(1)
        """)
        result = subprocess.run([sys.executable, "-c", code], capture_output=True)
        assert result.returncode == 1
        with live.single_instance(PORT):          # must be free immediately
            pass


class TestRefreshBusyFallback:
    def test_refresh_once_reads_from_disk_when_the_lock_is_held(self, tmp_path):
        """The rule: whoever loses the lock reads what the winner wrote."""
        payload = {key: {"key": key} for key in live.PAYLOAD_FILES}
        live.write_payload(payload, tmp_path)

        with live.single_instance(PORT):
            result = live.refresh_once(out_dir=tmp_path, lock_port=PORT,
                                       lock_wait=0.1)

        assert result.status == "read_from_disk"
        assert result.payload == payload

    def test_fresh_output_is_not_recomputed(self, tmp_path):
        """Belt and braces: the lock stops concurrency, this stops redundancy."""
        payload = {key: {"key": key} for key in live.PAYLOAD_FILES}
        live.write_payload(payload, tmp_path)

        result = live.refresh_once(out_dir=tmp_path, lock_port=PORT,
                                   freshness_floor=3600)
        assert result.status == "read_from_disk"
