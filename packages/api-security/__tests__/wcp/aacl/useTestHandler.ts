import { createWcpContext } from "@webiny/api-wcp";
const { DocumentClient } = require("aws-sdk/clients/dynamodb");
import { createHandler } from "@webiny/handler-aws";
import { PluginCollection } from "@webiny/plugins/types";
import { authenticateUsingHttpHeader } from "@webiny/api-security/plugins/authenticateUsingHttpHeader";
import { createSecurityContext } from "@webiny/api-security/index";
import { SecurityContext } from "@webiny/api-security/types";

import { customGroupAuthorizer } from "./mocks/customGroupAuthorizer";
import { customAuthenticator } from "./mocks/customAuthenticator";
import { triggerAuthentication } from "./mocks/triggerAuthentication";
import { createTenancyContext } from "@webiny/api-tenancy";
import { createStorageOperations as tenancyStorageOperations } from "@webiny/api-tenancy-so-ddb";

import { HandlerPlugin } from "@webiny/handler";

type UseTestHandlerParams = {
    plugins?: PluginCollection;
    overrideStorageOperations: (storageOperations: Record<string, any>) => void;
};

const documentClient = new DocumentClient({
    convertEmptyValues: true,
    endpoint: process.env.MOCK_DYNAMODB_ENDPOINT || "http://localhost:8001",
    sslEnabled: false,
    region: "local",
    accessKeyId: "test",
    secretAccessKey: "test"
});

export default (opts: UseTestHandlerParams = {}) => {
    // @ts-ignore
    if (typeof __getStorageOperations !== "function") {
        throw new Error(`There is no global "__getStorageOperations" function.`);
    }
    // @ts-ignore
    const { storageOperations } = __getStorageOperations();
    if (opts.overrideStorageOperations) {
        opts.overrideStorageOperations(storageOperations);
    }

    const plugins: PluginCollection = [
        createWcpContext(),
        // TODO: tenancy storage operations need to be loaded dynamically, but for now this will do since we only have DDB storage for this app.
        createTenancyContext({
            storageOperations: tenancyStorageOperations({
                documentClient,
                table: table => ({ ...table, name: process.env.DB_TABLE })
            })
        }),
        createSecurityContext({ storageOperations }),
        authenticateUsingHttpHeader(),
        triggerAuthentication(),
        customAuthenticator(),
        customGroupAuthorizer(),

        // We just want to return the context and then make assertions in tests.
        new HandlerPlugin(async context => context)
    ].filter(Boolean);

    if (opts.plugins) {
        plugins.push(...opts.plugins);
    }

    const handler = createHandler({ plugins });

    const invoke = async (): Promise<SecurityContext> => {
        return handler({
            httpMethod: "POST",
            headers: { "x-tenant": "root" },
            body: ""
        }) as SecurityContext;
    };

    return {
        documentClient,
        handler,
        invoke
    };
};
