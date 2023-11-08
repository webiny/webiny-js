const { getDocumentClient } = require("@webiny/aws-sdk/client-dynamodb");
const {
    processing,
    getCommandName,
    createDynamoStreamEvent,
    createDynamoStreamRecord
} = require("./processing");

const simulateStream = (documentClient, handler) => {
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

let documentClient = null;

const getClient = (params = {}, forceNew = false) => {
    let client = documentClient;
    if (!client || forceNew) {
        client = getDocumentClient({
            endpoint: process.env.MOCK_DYNAMODB_ENDPOINT || "http://localhost:8001",
            tls: false,
            region: "local",
            credentials: { accessKeyId: "test", secretAccessKey: "test" },
            ...params
        });
        if (forceNew) {
            return client;
        }
    }
    documentClient = client;

    return documentClient;
};

module.exports = {
    getDocumentClient: getClient,
    simulateStream,
    createDynamoStreamEvent,
    createDynamoStreamRecord
};
