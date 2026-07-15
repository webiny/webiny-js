import { NamespaceHandler, NamespaceHandlerExecutioner } from "./abstractions.js";
import { Result } from "@webiny/feature/exports/api.js";
import { NamespaceHandlerNotFoundError } from "../../domain/errors.js";
class NamespaceHandlerExecutionerImpl {
    constructor(namespaceHandlers){
        this.namespaceHandlers = namespaceHandlers;
    }
    async execute(params) {
        for (const handler of this.namespaceHandlers)if (false !== handler.canHandle(params.namespace)) return handler.execute(params);
        return Result.fail(new NamespaceHandlerNotFoundError(params.namespace));
    }
}
const NamespaceHandlerExecutioner_NamespaceHandlerExecutioner = NamespaceHandlerExecutioner.createImplementation({
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
export { NamespaceHandlerExecutioner_NamespaceHandlerExecutioner as NamespaceHandlerExecutioner };

//# sourceMappingURL=NamespaceHandlerExecutioner.js.map