import { registerOpenSearchCore } from "~/registerOpenSearchCore.js";
import { createTestOpenSearchClient } from "./createTestOpenSearchClient.js";

export const registerOpenSearchCoreForTests = () => {
    const client = createTestOpenSearchClient();
    return registerOpenSearchCore(client);
};
