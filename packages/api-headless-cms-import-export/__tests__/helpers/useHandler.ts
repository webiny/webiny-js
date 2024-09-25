import { createHeadlessCmsContext, createHeadlessCmsGraphQL } from "@webiny/api-headless-cms";
import graphQLHandlerPlugins from "@webiny/handler-graphql";
import { getStorageOps } from "@webiny/project-utils/testing/environment";
import { HeadlessCmsStorageOperations } from "@webiny/api-headless-cms/types";
import { createWcpContext } from "@webiny/api-wcp";
import { createTenancyAndSecurity } from "./tenancySecurity";
import { createDummyLocales, createIdentity, createPermissions } from "./helpers";
import { mockLocalesPlugins } from "@webiny/api-i18n/graphql/testing";
import i18nContext from "@webiny/api-i18n/graphql/context";
import {
    createApiGatewayHandler,
    createRawEventHandler,
    createRawHandler
} from "@webiny/handler-aws";
import { APIGatewayEvent, LambdaContext } from "@webiny/handler-aws/types";
import { PluginCollection } from "@webiny/plugins/types";
import { createBackgroundTaskContext } from "@webiny/tasks";
import { Context } from "~/types";
import { createModelPlugin } from "~tests/mocks/model";
import { createFileManagerContext } from "@webiny/api-file-manager";
import { FileManagerStorageOperations } from "@webiny/api-file-manager/types";
import { InvokeParams } from "./types";
import { createHeadlessCmsImportExport } from "~/index";
import { createGetExportContentEntries } from "./graphql/getExportContentEntries";
import { createExportContentEntries } from "./graphql/exportContentEntries";
import { createAbortExportContentEntries } from "./graphql/abortExportContentEntries";
import { createMockTaskServicePlugin } from "@webiny/project-utils/testing/tasks";
import { createValidateImportFromUrl } from "./graphql/validateImportFromUrl";
import { createGetValidateImportFromUrl } from "./graphql/getValidateImportFromUrl";
import { createCmsPlugins } from "~tests/helpers/models";
import { createImportFromUrl } from "~tests/helpers/graphql/importFromUrl";

export interface UseHandlerParams {
    plugins?: PluginCollection;
}

export const useHandler = <C extends Context = Context>(params?: UseHandlerParams) => {
    const { plugins: inputPlugins = [] } = params || {};
    const cmsStorage = getStorageOps<HeadlessCmsStorageOperations>("cms");
    const i18nStorage = getStorageOps<any[]>("i18n");

    process.env.S3_BUCKET = "a-mock-s3-bucket";

    const fileManagerStorage = getStorageOps<FileManagerStorageOperations>("fileManager");

    const plugins = [
        createModelPlugin(),
        createWcpContext(),
        ...cmsStorage.plugins,
        ...fileManagerStorage.plugins,
        ...createTenancyAndSecurity({
            setupGraphQL: false,
            permissions: createPermissions(),
            identity: createIdentity()
        }),
        i18nContext(),
        i18nStorage.storageOperations,
        createDummyLocales(),
        mockLocalesPlugins(),
        createHeadlessCmsContext({
            storageOperations: cmsStorage.storageOperations
        }),
        createHeadlessCmsGraphQL(),
        createBackgroundTaskContext(),
        createHeadlessCmsImportExport(),
        createFileManagerContext({
            storageOperations: fileManagerStorage.storageOperations
        }),
        graphQLHandlerPlugins(),
        createRawEventHandler(async ({ context }) => {
            return context;
        }),
        createMockTaskServicePlugin(),
        ...createCmsPlugins(),
        ...inputPlugins
    ];

    const rawHandler = createRawHandler<any, C>({
        plugins
    });

    const graphQLHandler = createApiGatewayHandler({
        plugins
    });

    const invoke = async <T = any>({
        httpMethod = "POST",
        body,
        headers = {},
        ...rest
    }: InvokeParams): Promise<[T, any]> => {
        const response = await graphQLHandler(
            {
                /**
                 * If no path defined, use /graphql as we want to make request to main api
                 */
                path: `/cms/manage/en-US`,
                httpMethod,
                headers: {
                    ["x-tenant"]: "root",
                    ["Content-Type"]: "application/json",
                    ...headers
                },
                body: JSON.stringify(body),
                ...rest
            } as unknown as APIGatewayEvent,
            {} as LambdaContext
        );
        // The first element is the response body, and the second is the raw response.
        return [JSON.parse(response.body || "{}"), response];
    };

    return {
        invoke,
        getExportContentEntries: createGetExportContentEntries(invoke),
        exportContentEntries: createExportContentEntries(invoke),
        abortExportContentEntries: createAbortExportContentEntries(invoke),
        validateImportFromUrl: createValidateImportFromUrl(invoke),
        getValidateImportFromUrl: createGetValidateImportFromUrl(invoke),
        importFromUrl: createImportFromUrl(invoke),
        createContext: async () => {
            return await rawHandler({}, {} as LambdaContext);
        }
    };
};
