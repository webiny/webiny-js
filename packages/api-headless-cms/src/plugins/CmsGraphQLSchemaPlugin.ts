import {
    GraphQLSchemaPlugin,
    GraphQLSchemaPluginConfig as BaseGraphQLSchemaPluginConfig,
    IGraphQLSchemaPlugin
} from "@webiny/handler-graphql";
import { ApiEndpoint, CmsContext } from "~/types";

export interface ICmsGraphQLSchemaPlugin<T = CmsContext> extends IGraphQLSchemaPlugin<T> {
    canUse?(endpoint: ApiEndpoint | null): boolean;
}

export interface CmsGraphQLSchemaPluginConfig<T = CmsContext>
    extends BaseGraphQLSchemaPluginConfig<T> {
    /**
     * All endpoints by default.
     */
    endpoint?: ApiEndpoint;
}

export class CmsGraphQLSchemaPlugin<T = CmsContext>
    extends GraphQLSchemaPlugin<T>
    implements ICmsGraphQLSchemaPlugin<T>
{
    public static override readonly type = "cms.graphql.schema";

    private readonly endpoint?: ApiEndpoint;

    constructor(config: CmsGraphQLSchemaPluginConfig<T>) {
        super(config);
        this.endpoint = config.endpoint;
    }

    public canUse(endpoint: ApiEndpoint | null): boolean {
        if (!this.endpoint || !endpoint) {
            return true;
        }
        return this.endpoint === endpoint;
    }
}

export const createCmsGraphQLSchemaPlugin = <T = CmsContext>(
    config: CmsGraphQLSchemaPluginConfig<T>
): ICmsGraphQLSchemaPlugin<T> => {
    return new CmsGraphQLSchemaPlugin(config);
};
