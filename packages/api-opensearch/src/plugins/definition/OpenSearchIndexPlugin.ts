import { Plugin } from "@webiny/plugins";
import type { OpenSearchIndexRequestBody } from "~/types.js";

export interface OpenSearchIndexPluginParams {
    body: OpenSearchIndexRequestBody;
}

export abstract class OpenSearchIndexPlugin extends Plugin {
    public readonly body: OpenSearchIndexRequestBody;

    public constructor(params: OpenSearchIndexPluginParams) {
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
