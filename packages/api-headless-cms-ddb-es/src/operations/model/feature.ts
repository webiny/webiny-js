import { createFeature } from "@webiny/feature/api/index.js";
import { DdbEsGetModel } from "./DdbEsGetModel.js";
import { DdbEsListModels } from "./DdbEsListModels.js";
import { DdbEsCreateModel } from "./DdbEsCreateModel.js";
import { DdbEsUpdateModel } from "./DdbEsUpdateModel.js";
import { DdbEsDeleteModel } from "./DdbEsDeleteModel.js";

export const DdbEsModelStorageOpsFeature = createFeature({
    name: "cms.ddbEs.modelStorageOps",
    register: container => {
        container.register(DdbEsGetModel);
        container.register(DdbEsListModels);
        container.register(DdbEsCreateModel);
        container.register(DdbEsUpdateModel);
        container.register(DdbEsDeleteModel);
    }
});
