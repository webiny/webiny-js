const { setTracking } = require("./../config");

module.exports = async () => {
    setTracking(false);
    console.log("INFO: tracking of Webiny stats is now DISABLED!");
};
