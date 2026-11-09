import { ApiExtension } from "~/extensions/index.js";
import { BuildParam } from "~/extensions/index.js";
import { BackgroundTasks } from "~/extensions/api/index.js";
import { ModelFieldCompression } from "~/extensions/api/index.js";
import { Smtp } from "~/extensions/api/index.js";
import { ApiRoute } from "~/extensions/aws/index.js";

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
