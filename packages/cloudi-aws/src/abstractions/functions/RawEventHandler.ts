import type { Constructor, Dependencies } from "@webiny/di";
import { CloudHandler } from "@cloudi/core";
import type { ICloudHandler } from "@cloudi/core";

export namespace RawEventHandler {
    export type Interface<TEvent = any, TResult = any> = ICloudHandler<TEvent, TResult>;

    export function createImplementation<I extends Constructor<Interface>>(params: {
        implementation: I;
        dependencies: Dependencies<I>;
    }) {
        return CloudHandler.createImplementation(params as any);
    }
}
