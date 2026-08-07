import { getDocumentClient } from "@webiny/project-utils/testing/dynamodb/index.js";
import { setStorageOps } from "@webiny/project-utils/testing/environment/index.js";
import { WebsocketsConnectionRegistry } from "../../src/index.js";

setStorageOps("websockets", () => {
    return {
        storageOperations: {},
        // The websockets storage is wired through DI now. We hand the test handlers a factory for
        // the real DDB-backed registry, and each handler registers it against ITS OWN
        // ConnectionRegistry token. Registering a DI feature here instead would bind the registry to
        // this package's (dist) view of the token, which wouldn't match the consuming package's
        // (src) token under vitest's tsconfig-paths resolution.
        createConnectionRegistry: () => new WebsocketsConnectionRegistry(getDocumentClient()),
        plugins: []
    };
});
