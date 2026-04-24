import type { APIGatewayEvent, APIGatewayProxyResult } from "@webiny/aws-sdk/types/index.js";
import type { Constructor, Dependencies } from "@webiny/di";
import { CloudHandler, type ICloudHandler } from "../CloudHandler.js";

export namespace ApiGatewayEventHandler {
    export type Interface = ICloudHandler<APIGatewayEvent, APIGatewayProxyResult>;

    export function createImplementation<I extends Constructor<Interface>>(params: {
        implementation: I;
        dependencies: Dependencies<I>;
    }) {
        return CloudHandler.createImplementation(params as any);
    }
}

export type { APIGatewayEvent, APIGatewayProxyResult };
