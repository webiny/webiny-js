import { createFeature } from "@webiny/feature/api/index.js";
import { DdbEsGetGroup } from "./DdbEsGetGroup.js";
import { DdbEsListGroups } from "./DdbEsListGroups.js";
import { DdbEsCreateGroup } from "./DdbEsCreateGroup.js";
import { DdbEsUpdateGroup } from "./DdbEsUpdateGroup.js";
import { DdbEsDeleteGroup } from "./DdbEsDeleteGroup.js";

export const DdbEsGroupStorageOpsFeature = createFeature({
    name: "cms.ddbEs.groupStorageOps",
    register: container => {
        container.register(DdbEsGetGroup);
        container.register(DdbEsListGroups);
        container.register(DdbEsCreateGroup);
        container.register(DdbEsUpdateGroup);
        container.register(DdbEsDeleteGroup);
    }
});
