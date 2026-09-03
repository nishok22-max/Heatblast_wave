// Render react-icons to transparent PNGs for use inside the deck diagrams.
const fs = require("fs");
const path = require("path");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const sharp = require("sharp");
const Fa = require("react-icons/fa6");

const OUT = path.join(__dirname, "icons");
fs.mkdirSync(OUT, { recursive: true });

// name -> [react-icons/fa6 export, hex colour]
const SET = {
  thermometer:  ["FaTemperatureHalf", "#8E1038"],
  sun:          ["FaSun", "#F5A03C"],
  droplet:      ["FaDroplet", "#1B6CA8"],
  wind:         ["FaWind", "#7A7F91"],
  person:       ["FaPersonWalking", "#241043"],
  city:         ["FaCity", "#7A7F91"],
  clock:        ["FaClock", "#C2185B"],
  phone:        ["FaMobileScreen", "#2E7D5B"],
  calendar:     ["FaCalendarDays", "#1B6CA8"],
  map:          ["FaMapLocationDot", "#C2185B"],
  grid:         ["FaBorderAll", "#241043"],
  cloud:        ["FaCloudArrowDown", "#1B6CA8"],
  book:         ["FaScaleBalanced", "#2E7D5B"],
  fire:         ["FaFire", "#D2541F"],
  heart:        ["FaHeartPulse", "#C2185B"],
  users:        ["FaUsers", "#8E1038"],
  box:          ["FaBoxOpen", "#241043"],
  desktop:      ["FaDesktop", "#1B6CA8"],
  helmet:       ["FaHelmetSafety", "#D2541F"],
  stethoscope:  ["FaStethoscope", "#2E7D5B"],
  building:     ["FaBuildingColumns", "#241043"],
  house:        ["FaHouse", "#8E1038"],
  bullhorn:     ["FaBullhorn", "#C2185B"],
  shield:       ["FaShieldHalved", "#2E7D5B"],
  warning:      ["FaTriangleExclamation", "#D2541F"],
  question:     ["FaCircleQuestion", "#1B6CA8"],
  gauge:        ["FaGaugeHigh", "#C2185B"],
  check:        ["FaCheck", "#2E7D5B"],
  xmark:        ["FaXmark", "#7A7F91"],
  moon:         ["FaMoon", "#241043"],
  flask:        ["FaFlask", "#1B6CA8"],
  truck:        ["FaTruckDroplet", "#1B6CA8"],
  leaf:         ["FaLeaf", "#2E7D5B"],
  rupee:        ["FaIndianRupeeSign", "#D2541F"],
  hospital:     ["FaHouseMedical", "#8E1038"],
  file:         ["FaFileCode", "#241043"],
  bolt:         ["FaBolt", "#F5A03C"],
  eye:          ["FaEye", "#1B6CA8"],
};

const missing = [];
(async () => {
  for (const [key, [icon, colour]] of Object.entries(SET)) {
    const Comp = Fa[icon];
    if (!Comp) { missing.push(`${key} -> ${icon}`); continue; }
    const svg = renderToStaticMarkup(
      React.createElement(Comp, { color: colour, size: 512 })
    );
    await sharp(Buffer.from(svg), { density: 600 })
      .resize(512, 512, { fit: "contain",
                          background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toFile(path.join(OUT, `${key}.png`));
  }
  console.log("rendered:", Object.keys(SET).length - missing.length);
  if (missing.length) console.log("MISSING:", missing.join(", "));
})();
