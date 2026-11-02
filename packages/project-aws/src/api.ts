import { ApiExtension, BuildParam } from "@webiny/project/extensions/index.js";
import { ApiRoute } from "./extensions/ApiRoute.js";
import {
    BackgroundTasks,
    ModelFieldCompression as CmsModelFieldCompression,
    Smtp as MailerSmtp
} from "@webiny/project/extensions/api/index.js";

export const Api = {
    Extension: ApiExtension,
    Route: ApiRoute,
    BackgroundTasks: BackgroundTasks,
    Mailer: {
        Smtp: MailerSmtp
    },
    Cms: {
        ModelFieldCompression: CmsModelFieldCompression
    },
    BuildParam: BuildParam
};
