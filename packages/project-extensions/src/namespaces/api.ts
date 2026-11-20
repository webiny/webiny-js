import { ApiExtension } from "@webiny/project/extensions/index.js";
import { BuildParam } from "@webiny/project/extensions/index.js";
import { BackgroundTasks } from "@webiny/project/extensions/api/index.js";
import { ModelFieldCompression } from "@webiny/project/extensions/api/index.js";
import { Smtp } from "@webiny/project/extensions/api/index.js";
import { ApiRoute } from "@webiny/project/extensions/api/index.js";

export const Api = {
    Extension: ApiExtension,
    Route: ApiRoute,
    BackgroundTasks,
    Mailer: {
        Smtp
    },
    Cms: {
        ModelFieldCompression
    },
    BuildParam
};
