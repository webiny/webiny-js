import { createFeature } from "@webiny/feature/api/index.js";
import { DdbGetModel } from "./DdbGetModel.js";
import { DdbListModels } from "./DdbListModels.js";
import { DdbCreateModel } from "./DdbCreateModel.js";
import { DdbUpdateModel } from "./DdbUpdateModel.js";
import { DdbDeleteModel } from "./DdbDeleteModel.js";

export const DdbModelStorageOpsFeature = createFeature({
    name: "cms.ddb.modelStorageOps",
    register: container => {
        container.register(DdbGetModel);
        container.register(DdbListModels);
        container.register(DdbCreateModel);
        container.register(DdbUpdateModel);
        container.register(DdbDeleteModel);
    }
});
