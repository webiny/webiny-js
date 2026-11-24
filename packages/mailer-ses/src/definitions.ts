import type { ExtensionDefinitionModel } from "@webiny/project/extensions/index.js";
import { MailerSes } from "./MailerSes.js";

/*
 * Registers `<MailerSes>` with the project SDK, which only knows the definitions it is given. Without
 * this, its props are not validated and the build warns that the extension type is unknown.
 */
export default [MailerSes.def] as unknown as ExtensionDefinitionModel<any>[];
