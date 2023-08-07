import {
    onBlockAfterCreateHook,
    onBlockAfterUpdateHook,
    onBlockAfterDeleteHook,
    onBlocksAfterExportHook,
    onBlocksAfterImportHook
} from "./blocks";
import {
    onBlockCategoryAfterCreateHook,
    onBlockCategoryAfterUpdateHook,
    onBlockCategoryAfterDeleteHook
} from "./blockCategories";
import { onPageAfterCreateHook, onPagesAfterExportHook, onPagesAfterImportHook } from "./pages";
import {
    onPageRevisionAfterCreateHook,
    onPageRevisionAfterUpdateHook,
    onPageRevisionAfterDeleteHook,
    onPageRevisionAfterPublishHook,
    onPageRevisionAfterUnpublishHook
} from "./pageRevisions";
import {
    onPageElementAfterCreateHook,
    onPageElementAfterUpdateHook,
    onPageElementAfterDeleteHook
} from "./pageElements";
import {
    onCategoryAfterCreateHook,
    onCategoryAfterUpdateHook,
    onCategoryAfterDeleteHook
} from "./categories";
import {
    onTemplateAfterCreateHook,
    onTemplateAfterUpdateHook,
    onTemplateAfterDeleteHook,
    onTemplatesAfterExportHook,
    onTemplatesAfterImportHook
} from "./templates";
import { onMenuAfterCreateHook, onMenuAfterUpdateHook, onMenuAfterDeleteHook } from "./menus";
import { onSettingsAfterUpdateHook } from "./settings";

import { AuditLogsContext } from "~/types";

export const createPageBuilderHooks = (context: AuditLogsContext) => {
    onBlockAfterCreateHook(context);
    onBlockAfterUpdateHook(context);
    onBlockAfterDeleteHook(context);
    onBlocksAfterExportHook(context);
    onBlocksAfterImportHook(context);
    onBlockCategoryAfterCreateHook(context);
    onBlockCategoryAfterUpdateHook(context);
    onBlockCategoryAfterDeleteHook(context);
    onPageAfterCreateHook(context);
    onPagesAfterExportHook(context);
    onPagesAfterImportHook(context);
    onPageRevisionAfterCreateHook(context);
    onPageRevisionAfterUpdateHook(context);
    onPageRevisionAfterDeleteHook(context);
    onPageRevisionAfterPublishHook(context);
    onPageRevisionAfterUnpublishHook(context);
    onPageElementAfterCreateHook(context);
    onPageElementAfterUpdateHook(context);
    onPageElementAfterDeleteHook(context);
    onCategoryAfterCreateHook(context);
    onCategoryAfterUpdateHook(context);
    onCategoryAfterDeleteHook(context);
    onTemplateAfterCreateHook(context);
    onTemplateAfterUpdateHook(context);
    onTemplateAfterDeleteHook(context);
    onTemplatesAfterExportHook(context);
    onTemplatesAfterImportHook(context);
    onMenuAfterCreateHook(context);
    onMenuAfterUpdateHook(context);
    onMenuAfterDeleteHook(context);
    onSettingsAfterUpdateHook(context);
};
