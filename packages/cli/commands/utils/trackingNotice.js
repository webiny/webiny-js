const { green } = require("chalk");

module.exports.trackingNotice = () => {
    console.log();
    console.log(
        `Webiny collects anonymous usage analytics to help improve the developer experience.`
    );
    console.log(`If you'd like to opt-out run ${green("webiny disable-tracking")}.`);
    console.log(`To learn more, check out https://www.webiny.com/telemetry/.`);
    console.log();
};