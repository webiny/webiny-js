import { registerOpenSearchCore } from "~/registerOpenSearchCore.js";
import { getTestOpenSearchClient } from "./createTestOpenSearchClient.js";

export const registerOpenSearchCoreForTests = () => {
    const client = getTestOpenSearchClient();
    return registerOpenSearchCore(client);
};
