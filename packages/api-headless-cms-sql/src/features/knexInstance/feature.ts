import { createFeature } from "@webiny/feature/api/index.js";
import type { Knex } from "knex";
import { KnexInstance } from "./abstractions.js";

export const KnexInstanceFeature = createFeature<Knex>({
    name: "cms.sql.knexInstance",
    register: (container, knex) => {
        container.registerFactory(KnexInstance, () => knex);
    }
});
