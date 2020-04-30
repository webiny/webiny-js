import {
    GraphQLContext,
    GraphQLContextPlugin,
    GraphQLMiddlewarePlugin,
    GraphQLSchemaPlugin
} from "@webiny/graphql/types";
import { shield } from "graphql-shield";
import authenticateJwt from "./authentication/authenticateJwt";
import { SecurityPlugin } from "@webiny/api-security/types";
import LambdaClient from "aws-sdk/clients/lambda";

const shieldMiddleware: GraphQLMiddlewarePlugin = {
    type: "graphql-middleware",
    name: "graphql-middleware-shield",
    middleware({ plugins }) {
        const middleware = [];
        plugins.byType<GraphQLSchemaPlugin>("graphql-schema").forEach(plugin => {
            let { security } = plugin;
            if (!security) {
                return true;
            }

            if (typeof security === "function") {
                security = security();
            }

            security.shield &&
                middleware.push(
                    shield(security.shield, {
                        allowExternalErrors: true
                    })
                );
        });

        return middleware;
    }
};

const middlewarePlugin = (options): GraphQLContextPlugin => ({
    type: "graphql-context",
    name: "graphql-context-security",
    apply: async context => {
        if (!context.event) {
            return;
        }

        context.security = options;
        context.token = null;
        context.user = null;
        context.getUser = () => context.user;

        const securityPlugins = context.plugins.byType<SecurityPlugin>("graphql-security");
        for (let i = 0; i < securityPlugins.length; i++) {
            await securityPlugins[i].authenticate(context);
        }
    }
});

const authenticatePat = options => async (context: GraphQLContext) => {
    if (context.user) {
        return;
    }

    const { event } = context;
    const { headers = {} } = event;
    const authorization = headers["Authorization"] || headers["authorization"] || "";

    if (!authorization) {
        return;
    }

    const token = authorization;
    const Lambda = new LambdaClient({ region: process.env.AWS_REGION });
    const user = JSON.parse(
        (
            await Lambda.invoke({
                FunctionName: options.validateAccessTokenFunction,
                Payload: JSON.stringify({ PAT: token })
            }).promise()
        ).Payload as string
    );

    context.token = token;
    context.user = user;
};

export default options => [
    shieldMiddleware,
    middlewarePlugin(options),
    {
        type: "graphql-security",
        name: "graphql-security-jwt",
        authenticate: authenticateJwt
    } as SecurityPlugin,
    {
        type: "graphql-security",
        name: "graphql-security-pat",
        authenticate: authenticatePat(options)
    } as SecurityPlugin
];
