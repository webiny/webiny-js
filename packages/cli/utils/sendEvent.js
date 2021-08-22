const { sendEvent } = require("@webiny/telemetry");
const { getProject } = require("../utils");

module.exports.sendEvent = ({ event, properties, extraPayload }) => {
    const project = getProject();
    if (project.config.cli && project.config.cli.telemetry === false) {
        return;
    }

    return sendEvent({
        event,
        properties,
        extraPayload
    });
};
