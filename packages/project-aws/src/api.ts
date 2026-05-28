import { ApiExtension, BuildParam } from "@webiny/project/extensions/index.js";
import { ApiRoute } from "./extensions/ApiRoute.js";
import { Smtp as MailerSmtp } from "./extensions/Mailer/Smtp.js";
import { ModelFieldCompression as CmsModelFieldCompression } from "./extensions/Cms/ModelFieldCompression.js";
import { BackgroundTasks } from "./extensions/BackgroundTasks.js";

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
