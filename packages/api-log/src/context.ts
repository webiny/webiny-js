import { ContextPlugin } from "@webiny/api/plugins/ContextPlugin.js";
import type { Context } from "~/types.js";
import { loggerFactory } from "~/logger/factory.js";
import { createCrud } from "~/crud/index.js";
import { checkPermissionFactory } from "~/security/checkPermission.js";
import { createGraphQl } from "~/graphql/index.js";
import type { DynamoDBDocument } from "@webiny/aws-sdk/client-dynamodb/index.js";

export interface ICreateLoggerContextParams {
    documentClient?: DynamoDBDocument;
    getTenant?: () => string;
    createGraphQL?: boolean;
}

const getDocumentClient = (context: Context) => {
    // @ts-expect-error
    const { documentClient } = context.db?.driver || {};
    if (!documentClient) {
        throw new Error("Missing document client on the context.");
    }
    return documentClient;
};

export const createContextPlugin = (params?: ICreateLoggerContextParams) => {
    const plugin = new ContextPlugin<Context>(async context => {
        const getTenant = () => {
            if (params?.getTenant) {
                return params.getTenant();
            }
            const tenant = context.tenancy?.getCurrentTenant?.();
            if (!tenant) {
                throw new Error("Missing tenant.");
            }
            return tenant.id;
        };

        const getContext = () => context;

        const { logger, storageOperations } = loggerFactory({
            documentClient: params?.documentClient || getDocumentClient(context),
            getTenant
        });

        context.logger = {
            log: logger,
            ...createCrud({
                getContext,
                storageOperations,
                checkPermission: checkPermissionFactory({ getContext })
            })
        };
        context.plugins.register(createGraphQl(params));
    });

    plugin.name = "logger.createContext";
    return plugin;
};
