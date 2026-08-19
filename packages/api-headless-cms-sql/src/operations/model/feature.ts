import { createFeature } from "@webiny/feature/api/index.js";
import { SqlGetModel } from "./SqlGetModel.js";
import { SqlListModels } from "./SqlListModels.js";
import { SqlCreateModel } from "./SqlCreateModel.js";
import { SqlUpdateModel } from "./SqlUpdateModel.js";
import { SqlDeleteModel } from "./SqlDeleteModel.js";

export const SqlModelStorageOpsFeature = createFeature({
    name: "cms.sql.modelStorageOps",
    register: container => {
        container.register(SqlGetModel);
        container.register(SqlListModels);
        container.register(SqlCreateModel);
        container.register(SqlUpdateModel);
        container.register(SqlDeleteModel);
    }
});
