import { registerOpensearchCore } from "@webiny/api-opensearch";
import type { Client } from "@webiny/api-opensearch";

export const registerOpensearchCoreForTests = (client: Client) => {
    return registerOpensearchCore(client);
};
