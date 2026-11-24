import type { ExtensionDefinitionModel } from "@webiny/project/extensions/index.js";
import { MailerResend } from "./MailerResend.js";

/*
 * Registers `<MailerResend>` with the project SDK, which only knows the definitions it is given. Without
 * this, its props are not validated and the build warns that the extension type is unknown.
 */
export default [MailerResend.def] as unknown as ExtensionDefinitionModel<any>[];
