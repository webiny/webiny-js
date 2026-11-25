import type { ExtensionDefinitionModel } from "@webiny/project/extensions/index.js";
import { MailerSmtp } from "./MailerSmtp.js";

/*
 * Registers `<MailerSmtp>` with the project SDK, which only knows the definitions it is given. Without
 * this, its props are not validated and the build warns that the extension type is unknown.
 */
export default [MailerSmtp.def] as unknown as ExtensionDefinitionModel<any>[];
