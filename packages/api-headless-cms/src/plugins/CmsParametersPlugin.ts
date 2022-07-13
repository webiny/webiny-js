import { Plugin } from "@webiny/plugins";
import { ApiEndpoint, CmsContext } from "~/types";

/**
 * Type can be null because it might be that Headless CMS context is loaded on a different Lambda where there is no GraphQL Schema generated.
 */
export type CmsParametersPluginResponseType = ApiEndpoint | null;
export type CmsParametersPluginResponseLocale = string;

export interface CmsParametersPluginResponse {
    type: CmsParametersPluginResponseType;
    locale: CmsParametersPluginResponseLocale;
}

export interface CmsParametersPluginCallable {
    (context: CmsContext): Promise<CmsParametersPluginResponse | null>;
}

export class CmsParametersPlugin extends Plugin {
    public static override readonly type: string = "cms-parameters-plugin";

    private readonly callable: CmsParametersPluginCallable;

    public constructor(callable: CmsParametersPluginCallable) {
        super();

        this.callable = callable;
    }

    public async getParameters(context: CmsContext): Promise<CmsParametersPluginResponse | null> {
        return this.callable(context);
    }
}
