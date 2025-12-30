import { createHeadlessCmsContext, createHeadlessCmsGraphQL } from "@webiny/api-headless-cms";
import graphQLHandlerPlugins from "@webiny/handler-graphql";
import { getStorageOps } from "@webiny/project-utils/testing/environment";
import type { HeadlessCmsStorageOperations } from "@webiny/api-headless-cms/types";
import { createTenancyAndSecurity } from "./tenancySecurity";
import { createIdentity, createPermissions } from "./helpers";
import {
    createApiGatewayHandler,
    createRawEventHandler,
    createRawHandler
} from "@webiny/handler-aws";
import type { APIGatewayEvent, LambdaContext } from "@webiny/handler-aws/types";
import type { PluginCollection } from "@webiny/plugins/types";
import { createBackgroundTaskContext } from "@webiny/tasks";
import type { Context } from "~/types";
import { createModelPlugin } from "~tests/mocks/model";
import { createFileManagerContext } from "@webiny/api-file-manager";
import type { InvokeParams } from "./types";
import { createHeadlessCmsImportExport } from "~/index";
import { createGetExportContentEntries } from "./graphql/getExportContentEntries";
import { createExportContentEntries } from "./graphql/exportContentEntries";
import { createAbortExportContentEntries } from "./graphql/abortExportContentEntries";
import { createMockTaskServicePlugin } from "@webiny/project-utils/testing/tasks";
import { createValidateImportFromUrl } from "./graphql/validateImportFromUrl";
import { createGetValidateImportFromUrl } from "./graphql/getValidateImportFromUrl";
import { createCmsPlugins } from "~tests/helpers/models";
import { createImportFromUrl } from "~tests/helpers/graphql/importFromUrl";
import { createApiCore } from "@webiny/api-core";
import type { ApiCoreStorageOperations } from "@webiny/api-core/types/core.js";

export interface UseHandlerParams {
    plugins?: PluginCollection;
}

export const useHandler = <C extends Context = Context>(params?: UseHandlerParams) => {
    const { plugins: inputPlugins = [] } = params || {};

    process.env.S3_BUCKET = "a-mock-s3-bucket";

    const apiCoreStorage = getStorageOps<ApiCoreStorageOperations>("apiCore");
    const cmsStorage = getStorageOps<HeadlessCmsStorageOperations>("cms");

    const plugins = [
        createApiCore({
            storageOperations: apiCoreStorage.storageOperations
        }),
        createModelPlugin(),
        ...cmsStorage.plugins,
        ...createTenancyAndSecurity({
            permissions: createPermissions(),
            identity: createIdentity()
        }),
        createHeadlessCmsContext({
            storageOperations: cmsStorage.storageOperations
        }),
        createHeadlessCmsGraphQL(),
        createBackgroundTaskContext(),
        createHeadlessCmsImportExport(),
        createFileManagerContext(),
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
