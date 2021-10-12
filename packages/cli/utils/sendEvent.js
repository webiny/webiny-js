const { sendEvent } = require("@webiny/telemetry/cli");
const getProject = require("./getProject");

module.exports = ({ event, properties, extraPayload }) => {
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
