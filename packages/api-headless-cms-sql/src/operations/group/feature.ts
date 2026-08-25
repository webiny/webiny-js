import { createFeature } from "@webiny/feature/api/index.js";
import { SqlGetGroup } from "./SqlGetGroup.js";
import { SqlListGroups } from "./SqlListGroups.js";
import { SqlCreateGroup } from "./SqlCreateGroup.js";
import { SqlUpdateGroup } from "./SqlUpdateGroup.js";
import { SqlDeleteGroup } from "./SqlDeleteGroup.js";

export const SqlGroupStorageOpsFeature = createFeature({
    name: "cms.sql.groupStorageOps",
    register: container => {
        container.register(SqlGetGroup);
        container.register(SqlListGroups);
        container.register(SqlCreateGroup);
        container.register(SqlUpdateGroup);
        container.register(SqlDeleteGroup);
    }
});
