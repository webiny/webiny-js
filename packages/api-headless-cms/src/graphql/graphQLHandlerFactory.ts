import debugPlugins from "@webiny/handler-graphql/debugPlugins.js";
import type { CmsContext } from "~/types/index.js";
import type { Plugin } from "@webiny/plugins/types.js";
import { RoutePlugin } from "@webiny/handler";
import { handleRequest } from "./handleRequest.js";

export interface GraphQLHandlerFactoryParams {
    debug?: boolean;
}

const cmsRoutes = new RoutePlugin<CmsContext>(({ onPost, onOptions, context }) => {
    // We no longer use `:locale` but we keep it for now to support external systems created wth v5.
    onPost("/cms/:type(^manage|preview|read$)/:locale?", async (request, reply) => {
        return handleRequest({ context, request, reply });
    });

    onOptions("/cms/:type(^manage|preview|read$)/:locale?", async (_, reply) => {
        return reply.status(204).send({}).hijack();
    });
});

cmsRoutes.name = "headless-cms.graphql.route.default";

export const graphQLHandlerFactory = ({ debug }: GraphQLHandlerFactoryParams): Plugin[] => {
    return [
        ...(debug ? debugPlugins() : []),
        cmsRoutes,
        {
            type: "wcp-telemetry-tracker"
        }
    ];
};
