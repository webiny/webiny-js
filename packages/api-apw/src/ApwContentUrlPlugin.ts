import { Plugin } from "@webiny/plugins";
import { ApwContentReview, ApwContentTypes, ApwWorkflow } from "~/types";

export interface ApwContentUrlPluginCbParams {
    baseUrl: string;
    contentReview: ApwContentReview;
    workflow: ApwWorkflow;
}
export interface ApwContentUrlPluginCb {
    (params: ApwContentUrlPluginCbParams): string | null;
}

export class ApwContentUrlPlugin extends Plugin {
    public static override type = "apw.contentUrl";

    private readonly cb: ApwContentUrlPluginCb;
    private readonly contentType: ApwContentTypes;

    public constructor(contentType: ApwContentTypes, cb: ApwContentUrlPluginCb) {
        super();

        this.contentType = contentType;
        this.cb = cb;
    }

    public canUse(contentType: ApwContentTypes): boolean {
        return this.contentType === contentType;
    }

    public create(params: ApwContentUrlPluginCbParams): string | null {
        return this.cb(params);
    }
}

export const createApwContentUrlPlugin = (
    contentType: ApwContentTypes,
    cb: ApwContentUrlPluginCb
) => {
    return new ApwContentUrlPlugin(contentType, cb);
};
