import { ApiExtension } from "@webiny/project/extensions/index.js";
import { BuildParam } from "@webiny/project/extensions/index.js";
import { BackgroundTasks } from "@webiny/project/extensions/api/index.js";
import { ModelFieldCompression } from "@webiny/project/extensions/api/index.js";
import { ApiRoute } from "@webiny/project/extensions/api/index.js";
import { MailerSmtp } from "@webiny/mailer-smtp";

export const Api = {
    Extension: ApiExtension,
    Route: ApiRoute,
    BackgroundTasks,
    Mailer: {
        Smtp: MailerSmtp
    },
    Cms: {
        ModelFieldCompression
    },
    BuildParam
};
