import { createFeature } from "@webiny/feature/api/index.js";
import type { Knex } from "knex";
import { KnexInstanceAbstraction } from "./abstractions.js";

export const KnexInstanceFeature = (knex: Knex) => {
    return createFeature({
        name: "cms.sql.knexInstance",
        register: container => {
            container.registerFactory(KnexInstanceAbstraction, () => knex);
        }
    });
};
