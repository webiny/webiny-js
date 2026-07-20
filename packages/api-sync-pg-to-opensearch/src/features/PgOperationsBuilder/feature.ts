import { createFeature } from "@webiny/feature/api";
import { PgOperationsBuilder } from "./PgOperationsBuilder.js";

export const PgOperationsBuilderFeature = createFeature({
    name: "sync.pg.operationsBuilder",
    register(container) {
        container.register(PgOperationsBuilder);
    }
});
