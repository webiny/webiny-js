import { AssetOutputStrategy, Asset, AssetReply, AssetRequest } from "~/delivery";
import { FileManagerContext } from "~/types";
import { ResponseHeaders } from "@webiny/handler";

export interface ResponseHeadersParams {
    headers: ResponseHeaders;
    context: FileManagerContext;
    assetRequest: AssetRequest;
    asset: Asset;
}

export interface ResponseHeadersSetter {
    (params: ResponseHeadersParams): Promise<void> | void;
}

export class SetResponseHeaders implements AssetOutputStrategy {
    private readonly setter: ResponseHeadersSetter;
    private readonly context: FileManagerContext;
    private readonly assetRequest: AssetRequest;
    private readonly asset: Asset;
    private strategy: AssetOutputStrategy;

    constructor(
        setter: ResponseHeadersSetter,
        context: FileManagerContext,
        assetRequest: AssetRequest,
        asset: Asset,
        strategy: AssetOutputStrategy
    ) {
        this.setter = setter;
        this.context = context;
        this.assetRequest = assetRequest;
        this.asset = asset;
        this.strategy = strategy;
    }

    async output(asset: Asset): Promise<AssetReply> {
        const reply = await this.strategy.output(asset);

        await this.setter({
            asset: this.asset,
            assetRequest: this.assetRequest,
            context: this.context,
            headers: reply.getHeaders()
        });

        return reply;
    }
}
