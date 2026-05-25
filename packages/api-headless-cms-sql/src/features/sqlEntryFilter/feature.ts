import { createFeature } from "@webiny/feature/api/index.js";
import { DefaultFilter } from "./fields/DefaultFilter.js";
import { ObjectFilter } from "./fields/ObjectFilter.js";
import { RefFilter } from "./fields/RefFilter.js";
import { SqlEntryFilterRegistry } from "./SqlEntryFilterRegistry.js";

export const SqlEntryFilterFeature = createFeature({
    name: "cms.sql.entryFilterFeature",
    register: container => {
        container.register(DefaultFilter);
        container.register(ObjectFilter);
        container.register(RefFilter);
        container.register(SqlEntryFilterRegistry).inSingletonScope();
    }
});
