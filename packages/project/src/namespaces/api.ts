import { ApiExtension, BuildParam } from "~/extensions/index.js";
import { BackgroundTasks, ModelFieldCompression, Smtp } from "~/extensions/api/index.js";
import { ApiRoute } from "~/extensions/aws/index.js";
import { awsOnly } from "~/extensions/hosting/index.js";

export const Api = {
    Extension: ApiExtension,
    Route: awsOnly("Api.Route", ApiRoute),
    BackgroundTasks,
    Mailer: {
        Smtp
    },
    Cms: {
        ModelFieldCompression
    },
    BuildParam
};
