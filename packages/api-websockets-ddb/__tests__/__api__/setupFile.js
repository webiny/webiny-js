import { getDocumentClient } from "@webiny/project-utils/testing/dynamodb/index.js";
import { setStorageOps } from "@webiny/project-utils/testing/environment/index.js";
import { registerWebsocketsDdbStorageOperations } from "../../src/index.js";

setStorageOps("websockets", () => {
    const documentClient = getDocumentClient();

    return {
        storageOperations: {},
        plugins: [registerWebsocketsDdbStorageOperations({ documentClient })]
    };
});
