import { createFeature } from "@webiny/feature/api/index.js";
import { DdbGetGroup } from "./DdbGetGroup.js";
import { DdbListGroups } from "./DdbListGroups.js";
import { DdbCreateGroup } from "./DdbCreateGroup.js";
import { DdbUpdateGroup } from "./DdbUpdateGroup.js";
import { DdbDeleteGroup } from "./DdbDeleteGroup.js";

export const DdbGroupStorageOpsFeature = createFeature({
    name: "cms.ddb.groupStorageOps",
    register: container => {
        container.register(DdbGetGroup);
        container.register(DdbListGroups);
        container.register(DdbCreateGroup);
        container.register(DdbUpdateGroup);
        container.register(DdbDeleteGroup);
    }
});
