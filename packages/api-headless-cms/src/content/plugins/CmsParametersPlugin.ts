import { Plugin } from "@webiny/plugins";
import { CmsContext } from "~/types";

export interface CmsParametersPluginResponse {
    type: "read" | "manage" | "preview" | string;
    locale: string;
}

export interface CmsParametersPluginCallable {
    (context: CmsContext): Promise<CmsParametersPluginResponse>;
}

export class CmsParametersPlugin extends Plugin {
    public static readonly type: string = "cms-parameters-plugin";

    private readonly callable: CmsParametersPluginCallable;

    public constructor(callable: CmsParametersPluginCallable) {
        super();

        this.callable = callable;
    }

    public async getParameters(context: CmsContext): Promise<CmsParametersPluginResponse | null> {
        return this.callable(context);
    }
}
