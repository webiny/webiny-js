import { createCommand } from "webiny/admin/website-builder/page/editor";

export const OpenSettingsDialog = createCommand<{ elementId: string }>("Fub/OpenSettingsDialog");
