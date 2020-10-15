import { createHandler } from "@webiny/handler-aws";
import apolloGatewayHandler from "@webiny/handler-apollo-gateway";

export const handler = createHandler(
    apolloGatewayHandler({
        debug: process.env.DEBUG,
        // server: {
        //     introspection: process.env.GRAPHQL_INTROSPECTION
        // },
        services: Object.keys(process.env)
            .filter(name => name.startsWith("LAMBDA_SERVICE_"))
            .map(name => {
                const serviceName = name.replace("LAMBDA_SERVICE_", "");
                return {
                    name: serviceName,
                    function: process.env[name]
                };
            })
    })
);
