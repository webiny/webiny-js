import { ApiExtension, BuildParam } from "@webiny/project/extensions/index.js";
import { ApiRoute } from "./extensions/ApiRoute.js";
import { BackgroundTasks } from "@webiny/project/extensions/api/index.js";
import { ModelFieldCompression as CmsModelFieldCompression } from "@webiny/project/extensions/api/index.js";

export const Api = {
    Extension: ApiExtension,
    Route: ApiRoute,
    BackgroundTasks: BackgroundTasks,
    Cms: {
        ModelFieldCompression: CmsModelFieldCompression
    },
    BuildParam: BuildParam
};
