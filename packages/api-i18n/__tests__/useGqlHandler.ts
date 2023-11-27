import { createWcpContext, createWcpGraphQL } from "@webiny/api-wcp";
import { createHandler } from "@webiny/handler-aws";
import graphqlHandler from "@webiny/handler-graphql";
import { SecurityIdentity, SecurityPermission } from "@webiny/api-security/types";
import i18nPlugins from "~/graphql";
import { apiCallsFactory } from "./helpers";
import { createTenancyAndSecurity } from "./tenancySecurity";
import { I18NContext } from "~/types";
import { getStorageOps } from "@webiny/project-utils/testing/environment";
import { APIGatewayEvent, LambdaContext } from "@webiny/handler-aws/types";

type UseGqlHandlerParams = {
    permissions?: SecurityPermission[];
    identity?: SecurityIdentity;
    plugins?: any;
};

export default (params: UseGqlHandlerParams = {}) => {
    const { plugins: extraPlugins } = params;

    const i18nStorage = getStorageOps("i18n");

    // Creates the actual handler. Feel free to add additional plugins if needed.
    const handler = createHandler({
        plugins: [
            createWcpContext(),
            createWcpGraphQL(),
            i18nStorage.storageOperations,
            ...createTenancyAndSecurity(),
            graphqlHandler(),
            {
                type: "context",
                apply(context: I18NContext) {
                    // @ts-expect-error
                    context.tenancy.getCurrentTenant = () => {
                        return {
                            id: "root",
                            name: "Root",
                            parent: null
                        };
                    };
                }
            },
            i18nPlugins(),
            extraPlugins || []
        ]
    });

    // Let's also create the "invoke" function. This will make handler invocations in actual tests easier and nicer.
    const invoke = async ({ httpMethod = "POST", body = {}, headers = {}, ...rest }) => {
        const response = await handler(
            {
                path: "/graphql",
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
        return [JSON.parse(response.body), response];
    };

    return {
        handler,
        invoke,
        ...apiCallsFactory(invoke)
    };
};
