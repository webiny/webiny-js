import { createFeature } from "@webiny/feature/api";
import type { Knex } from "knex";
import { KnexClient as KnexClientAbstraction } from "./abstractions.js";
import { KnexClient } from "./KnexClient.js";

export { KnexClient } from "./abstractions.js";

export const KnexClientFeature = createFeature<Knex>({
    name: "Db/Sql/KnexClientFeature",
    register(container, knex) {
        const client = new KnexClient({ knex });
        container.registerInstance(KnexClientAbstraction, client);
    }
});
