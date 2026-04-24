import type { EventBridgeEvent } from "@webiny/aws-sdk/types/index.js";
import type { Constructor, Dependencies } from "@webiny/di";
import { CloudHandler, type ICloudHandler } from "../CloudHandler.js";

export interface EventBridgeResult {
    success: boolean;
    message?: string;
}

export namespace EventBridgeEventHandler {
    export type Interface<TDetailType extends string = string, TDetail = any> = ICloudHandler<
        EventBridgeEvent<TDetailType, TDetail>,
        EventBridgeResult
    >;

    export function createImplementation<I extends Constructor<Interface>>(params: {
        implementation: I;
        dependencies: Dependencies<I>;
    }) {
        return CloudHandler.createImplementation(params as any);
    }
}

export type { EventBridgeEvent };
