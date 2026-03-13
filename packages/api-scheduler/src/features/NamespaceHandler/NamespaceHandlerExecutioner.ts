import {
    NamespaceHandler,
    NamespaceHandlerExecutioner as NamespaceHandlerExecutionerAbstraction
} from "./abstractions.js";
import { Result } from "@webiny/feature/exports/api.js";
import { NamespaceHandlerNotFoundError } from "~/domain/errors.js";

class NamespaceHandlerExecutionerImpl implements NamespaceHandlerExecutionerAbstraction.Interface {
    public constructor(private readonly namespaceHandlers: NamespaceHandler.Interface[]) {}

    public async execute(
        params: NamespaceHandlerExecutionerAbstraction.Params
    ): NamespaceHandlerExecutionerAbstraction.Response {
        for (const handler of this.namespaceHandlers) {
            if (handler.canHandle(params.namespace)) {
                continue;
            }
            return handler.execute(params);
        }

        return Result.fail(new NamespaceHandlerNotFoundError(params.namespace));
    }
}

export const NamespaceHandlerExecutioner =
    NamespaceHandlerExecutionerAbstraction.createImplementation({
        implementation: NamespaceHandlerExecutionerImpl,
        dependencies: [
            [
                NamespaceHandler,
                {
                    multiple: true
                }
            ]
        ]
    });
