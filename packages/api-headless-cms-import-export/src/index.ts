import { ContextPlugin } from "@webiny/api";
import type { Plugin } from "@webiny/plugins/types.js";
import { attachHeadlessCmsImportExportGraphQL } from "~/graphql/index.js";
import type { Context } from "./types.js";
import { isHeadlessCmsReady } from "@webiny/api-headless-cms";
import { createHeadlessCmsImportExportCrud } from "~/crud/index.js";
import {
    createImportFromUrlDownloadTask,
    createImportFromUrlProcessEntriesTask,
    createImportFromUrlProcessAssetsTask
} from "~/tasks/index.js";
import { ExportContentEntriesControllerTaskFeature } from "~/features/ExportContentEntriesControllerTask/feature.js";
import { ExportContentEntriesTaskFeature } from "~/features/ExportContentEntriesTask/feature.js";
import { ExportContentAssetsTaskFeature } from "~/features/ExportContentAssetsTask/feature.js";
import { ValidateImportFromUrlTaskFeature } from "~/features/ValidateImportFromUrlTask/feature.js";
import { ImportFromUrlControllerTaskFeature } from "~/features/ImportFromUrlControllerTask/feature.js";

export const createHeadlessCmsImportExport = (): Plugin[] => {
    const plugin = new ContextPlugin<Context>(async context => {
        const installed = await isHeadlessCmsReady(context);
        if (!installed) {
            return;
        }

        ExportContentEntriesControllerTaskFeature.register(context.container);
        ExportContentEntriesTaskFeature.register(context.container);
        ExportContentAssetsTaskFeature.register(context.container);
        ValidateImportFromUrlTaskFeature.register(context.container);
        ImportFromUrlControllerTaskFeature.register(context.container);

        context.plugins.register(
            createImportFromUrlDownloadTask(),
            createImportFromUrlProcessEntriesTask(),
            createImportFromUrlProcessAssetsTask()
        );

        context.cmsImportExport = await createHeadlessCmsImportExportCrud(context);
        await attachHeadlessCmsImportExportGraphQL(context);
    });
    plugin.name = "headlessCms.context.importExport";
    return [plugin];
};
