const os = require("os");
const path = require("path");
const readJson = require("load-json-file");
const writeJson = require("write-json-file");

const configPath = path.join(os.homedir(), ".webiny", "config");

module.exports.upgradeTelemetry = async (file, filePath, { info }) => {
    // Upgrade config file
    try {
        const config = await readJson(configPath);
        if (config) {
            const telemetry = "tracking" in config ? config.tracking : true;
            delete config["tracking"];
            config.telemetry = telemetry;
            writeJson.sync(configPath, config);
        }
    } catch {
        // Do nothing
    }

    // Upgrade telemetry import
    info(`Upgrading ${info.hl(filePath)}`);

    const telemetryImport = file.getImportDeclaration("@webiny/tracking/react");

    if (telemetryImport) {
        telemetryImport.setModuleSpecifier("@webiny/telemetry/react");
    }
};
