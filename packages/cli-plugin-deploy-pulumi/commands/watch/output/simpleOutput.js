const os = require("os");
const logUpdate = require("log-update");

let logs = [];
let deployment = "Initial state...";

module.exports = {
    type: "watch-output",
    name: "watch-output-terminal",
    log({ message }) {
        message = message.trim();
        if (!message || message.includes("update aws:")) {
            return;
        }

        if (message.includes("Updat")) {
            deployment = message;
        } else {
            logs.push(message);
        }

        logUpdate(logs.join(os.EOL) + os.EOL + "--------" + os.EOL + deployment);
        // process.stdout.write(logs.join(os.EOL) + os.EOL + deployment + "\r"); // needs return '/r'
    }
};
