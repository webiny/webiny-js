import { createImplementation } from "@webiny/di";
import { ApiGatewayEventQualifier } from "~/abstractions/ApiGatewayEventQualifier.js";

export class ApiGatewayEventQualifierImpl implements ApiGatewayEventQualifier.Interface {
    execute(event: any): boolean {
        return !!event.httpMethod && !!event.requestContext;
    }
}

export const apiGatewayEventQualifier = createImplementation({
    abstraction: ApiGatewayEventQualifier,
    implementation: ApiGatewayEventQualifierImpl,
    dependencies: []
});

