import type {
    AssetOutputStrategy,
    Asset,
    AssetReply,
    AssetRequest,
    AssetOutputStrategyDecoratorParams
} from "~/delivery/index.js";
import type { ResponseHeaders } from "@webiny/handler";
import type { ApiCoreContext } from "@webiny/api-core/types/core.js";

export interface ResponseHeadersParams {
    headers: ResponseHeaders;
    context: ApiCoreContext;
    assetRequest: AssetRequest;
    asset: Asset;
}

export interface ResponseHeadersSetter {
    (params: ResponseHeadersParams): Promise<void> | void;
}

export class SetResponseHeaders implements AssetOutputStrategy {
    private readonly setter: ResponseHeadersSetter;
    private strategyDecoratorParams: AssetOutputStrategyDecoratorParams;

    constructor(
        setter: ResponseHeadersSetter,
        strategyDecoratorParams: AssetOutputStrategyDecoratorParams
    ) {
        this.strategyDecoratorParams = strategyDecoratorParams;
        this.setter = setter;
    }

    async output(asset: Asset): Promise<AssetReply> {
        const reply = await this.strategyDecoratorParams.assetOutputStrategy.output(asset);

        await this.setter({
            asset: this.strategyDecoratorParams.asset,
            assetRequest: this.strategyDecoratorParams.assetRequest,
            context: this.strategyDecoratorParams.context,
            headers: reply.getHeaders()
        });

        return reply;
    }
}
