import { createFeature } from "@webiny/feature/api/index.js";
import { GroupSchemaManager } from "./GroupSchemaManager.js";

export const GroupSchemaManagerFeature = createFeature({
    name: "cms.sql.groupSchemaManager",
    register: container => {
        container.register(GroupSchemaManager).inSingletonScope();
    }
});
