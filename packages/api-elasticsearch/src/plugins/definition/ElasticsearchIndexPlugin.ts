import { Plugin } from "@webiny/plugins";
import type { ElasticsearchIndexRequestBody } from "~/types.js";

export interface ElasticsearchIndexPluginParams {
    body: ElasticsearchIndexRequestBody;
}

export abstract class ElasticsearchIndexPlugin extends Plugin {
    public readonly body: ElasticsearchIndexRequestBody;

    public constructor(params: ElasticsearchIndexPluginParams) {
        super();
        const { body } = params;
        this.body = {
            ...body
        };
    }

    public canUse(): boolean {
        return true;
    }
}
