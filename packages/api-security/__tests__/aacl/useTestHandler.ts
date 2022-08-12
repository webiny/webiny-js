import { createWcpContext } from "@webiny/api-wcp";
const { DocumentClient } = require("aws-sdk/clients/dynamodb");
import { createHandler } from "@webiny/handler-aws";
import { PluginCollection } from "@webiny/plugins/types";
import { authenticateUsingHttpHeader } from "@webiny/api-security/plugins/authenticateUsingHttpHeader";
import { createSecurityContext } from "@webiny/api-security";

import { customGroupAuthorizer } from "./mocks/customGroupAuthorizer";
import { customAuthenticator } from "./mocks/customAuthenticator";
import { triggerAuthentication } from "./mocks/triggerAuthentication";

import { WcpContext } from "@webiny/api-wcp/types";
import { HandlerPlugin } from "@webiny/handler";

type UseTestHandlerParams = {
    plugins?: PluginCollection;
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

    const plugins: PluginCollection = [
        createWcpContext(),
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

    const invoke = async (): Promise<WcpContext> => {
        return handler({
            httpMethod: "POST",
            headers: { "x-tenant": "root" },
            body: ""
        }) as WcpContext;
    };

    return {
        documentClient,
        handler,
        invoke
    };
};
