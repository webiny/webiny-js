import { createEventHandler, createHandler } from "@webiny/handler-aws/raw";
import { getStorageOps } from "@webiny/project-utils/testing/environment";
import { FileManagerStorageOperations } from "@webiny/api-file-manager/types";
import { HeadlessCmsStorageOperations } from "@webiny/api-headless-cms/types";
import i18nContext from "@webiny/api-i18n/graphql/context";
import { mockLocalesPlugins } from "@webiny/api-i18n/graphql/testing";
import { CmsParametersPlugin, createHeadlessCmsContext } from "@webiny/api-headless-cms";
import { createFileManagerContext } from "@webiny/api-file-manager";
import { PbContext } from "~/graphql/types";
import { PageBuilderStorageOperations } from "~/types";
import { createTenancyAndSecurity } from "~tests/tenancySecurity";
import { createPageBuilderContext } from "~/graphql";
import { LambdaContext } from "@webiny/handler-aws/types";

export const useHandler = () => {
    const i18nStorage = getStorageOps<any>("i18n");
    const pageBuilderStorage = getStorageOps<PageBuilderStorageOperations>("pageBuilder");
    const fileManagerStorage = getStorageOps<FileManagerStorageOperations>("fileManager");
    const cmsStorage = getStorageOps<HeadlessCmsStorageOperations>("cms");

    const handler = createHandler<any, PbContext>({
        plugins: [
            createEventHandler(async ({ context }) => {
                return context;
            }),
            ...cmsStorage.plugins,
            ...pageBuilderStorage.plugins,
            ...createTenancyAndSecurity(),
            i18nContext(),
            i18nStorage.storageOperations,
            mockLocalesPlugins(),
            createHeadlessCmsContext({ storageOperations: cmsStorage.storageOperations }),
            createFileManagerContext({ storageOperations: fileManagerStorage.storageOperations }),
            createPageBuilderContext({ storageOperations: pageBuilderStorage.storageOperations }),
            new CmsParametersPlugin(async context => {
                const locale = context.i18n.getCurrentLocale("content")?.code || "en-US";
                return {
                    type: "manage",
                    locale
                };
            })
        ]
    });

    return {
        handler: () => {
            return handler(
                {
                    headers: {
                        "x-tenant": "root"
                    }
                },
                {} as LambdaContext
            );
        }
    };
};
