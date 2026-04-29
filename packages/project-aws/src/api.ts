import { ApiExtension, BuildParam } from "@webiny/project/extensions/index.js";
import { ApiRoute } from "./extensions/ApiRoute.js";
import { Smtp as MailerSmtp } from "./extensions/Mailer/Smtp.js";

export const Api = {
    Extension: ApiExtension,
    Route: ApiRoute,
    Mailer: {
        Smtp: MailerSmtp
    },
    BuildParam: BuildParam
};
