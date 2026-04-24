import { ContextPlugin } from "@webiny/api";
import type { Plugin } from "@webiny/plugins/types.js";
import { attachHeadlessCmsImportExportGraphQL } from "~/graphql/index.js";
import type { Context } from "./types.js";
import { isHeadlessCmsReady } from "@webiny/api-headless-cms";
import { createHeadlessCmsImportExportCrud } from "~/crud/index.js";
import { ExportContentEntriesControllerTaskFeature } from "~/features/ExportContentEntriesControllerTask/feature.js";
import { ExportContentEntriesTaskFeature } from "~/features/ExportContentEntriesTask/feature.js";
import { ExportContentAssetsTaskFeature } from "~/features/ExportContentAssetsTask/feature.js";
import { ValidateImportFromUrlTaskFeature } from "~/features/ValidateImportFromUrlTask/feature.js";
import { ImportFromUrlControllerTaskFeature } from "~/features/ImportFromUrlControllerTask/feature.js";
import { ImportFromUrlDownloadTaskFeature } from "~/features/ImportFromUrlDownloadTask/feature.js";
import { ImportFromUrlProcessEntriesTaskFeature } from "~/features/ImportFromUrlProcessEntriesTask/feature.js";
import { ImportFromUrlProcessAssetsTaskFeature } from "~/features/ImportFromUrlProcessAssetsTask/feature.js";
import { createBeforeHandlerPlugin } from "@webiny/handler";

export const createHeadlessCmsImportExport = (): Plugin[] => {
    const contextPlugin = new ContextPlugin<Context>(async context => {
        const installed = await isHeadlessCmsReady(context);
        if (!installed) {
            return;
        }

        ExportContentEntriesControllerTaskFeature.register(context.container);
        ExportContentEntriesTaskFeature.register(context.container);
        ExportContentAssetsTaskFeature.register(context.container);
        ValidateImportFromUrlTaskFeature.register(context.container);
        ImportFromUrlControllerTaskFeature.register(context.container);
        ImportFromUrlDownloadTaskFeature.register(context.container);
        ImportFromUrlProcessEntriesTaskFeature.register(context.container);
        ImportFromUrlProcessAssetsTaskFeature.register(context.container);

        context.cmsImportExport = await createHeadlessCmsImportExportCrud(context);
    });
    contextPlugin.name = "headlessCms.context.importExport";

    const beforeHandlerPlugin = createBeforeHandlerPlugin<Context>(async context => {
        await attachHeadlessCmsImportExportGraphQL(context);
    });
    beforeHandlerPlugin.name = "headlessCms.beforeHandler.importExport";

    return [contextPlugin, beforeHandlerPlugin];
};
