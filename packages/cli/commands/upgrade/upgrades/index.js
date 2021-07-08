const upgrade550 = require("./5.5.0");
const upgrade580 = require("./5.8.0");
const upgrade590 = require("./5.9.0");
const upgrade5100 = require("./5.10.0");
const upgrade5110 = require("./5.11.0");

module.exports = [upgrade550, upgrade580(), upgrade590, upgrade5100, upgrade5110];
