import { registerOpensearchCore } from "~/registerOpensearchCore.js";
import type { Client } from "~/types.js";

export const registerOpensearchCoreForTests = (client: Client) => {
    return registerOpensearchCore(client);
};
