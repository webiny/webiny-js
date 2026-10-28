import debugPlugins from "@webiny/handler-graphql/debugPlugins.js";
import type { CmsContext } from "~/types/index.js";
import type { Plugin } from "@webiny/plugins/types.js";
import { RoutePlugin } from "@webiny/handler";
import { handleRequest } from "./handleRequest.js";
import type { Request } from "@webiny/handler/types.js";
import { CmsGraphQLSchemaVariant } from "~/features/graphql/index.js";

export interface GraphQLHandlerFactoryParams {
    debug?: boolean;
}

const getSchemaVariant = (context: CmsContext, request: Request) => {
    const { variant: name } = request.params as Record<string, string>;
    return context.container.resolveAll(CmsGraphQLSchemaVariant).find(variant => {
        return variant.name === name;
    });
};

const cmsRoutes = new RoutePlugin<CmsContext>(({ onPost, onOptions, context }) => {
    // We no longer use `:locale` but we keep it for now to support external systems created wth v5.
    onPost("/cms/:type(^manage|preview|read$)/:locale?", async (request, reply) => {
        return handleRequest({ context, request, reply });
    });

    onOptions("/cms/:type(^manage|preview|read$)/:locale?", async (_, reply) => {
        return reply.status(204).send({}).hijack();
    });

    /**
     * Schema variants, for example `/cms/v5/read` for clients built against v5. A variant is only
     * served when an extension registers a `CmsGraphQLSchemaVariant` with that name.
     */
    onPost(
        "/cms/:variant(^v[0-9]+$)/:type(^manage|preview|read$)/:locale?",
        async (request, reply) => {
            const variant = getSchemaVariant(context, request);
            if (!variant) {
                return reply
                    .code(404)
                    .send({ data: null, error: { message: "Not found.", code: "NOT_FOUND" } });
            }
            return handleRequest({ context, request, reply, variant });
        }
    );

    onOptions(
        "/cms/:variant(^v[0-9]+$)/:type(^manage|preview|read$)/:locale?",
        async (request, reply) => {
            if (!getSchemaVariant(context, request)) {
                return reply.code(404).send({}).hijack();
            }
            return reply.status(204).send({}).hijack();
        }
    );
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
