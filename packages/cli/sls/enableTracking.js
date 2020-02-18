const { setTracking } = require("./../config");

module.exports = async () => {
    setTracking(true);
    console.log(
        "INFO: tracking of Webiny stats is now ENABLED! Thank you for helping us with anonymous data 🎉"
    );
};
