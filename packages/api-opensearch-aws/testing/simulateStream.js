import { processing, getCommandName } from "./processing.js";
export { createDynamoStreamEvent, createDynamoStreamRecord } from "./processing.js";

export const simulateStream = (documentClient, handler) => {
    const originalSend = documentClient["send"];
    documentClient.send = async (...params) => {
        const [command] = params;

        const name = getCommandName(command);
        if (name) {
            if (!processing[name]) {
                throw new Error(`Missing handler for "${name}" command.`);
            }
            try {
                await processing[name](documentClient, handler, command);
            } catch (ex) {
                console.log(JSON.stringify(command));
                throw new Error(`Error processing "${name}" command: ${ex.message}`, ex);
            }
        }

        return await originalSend.apply(documentClient, params);
    };
};
