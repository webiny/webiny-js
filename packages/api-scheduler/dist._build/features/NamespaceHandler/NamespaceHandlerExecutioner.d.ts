import { NamespaceHandler, NamespaceHandlerExecutioner as NamespaceHandlerExecutionerAbstraction } from "./abstractions.js";
import type { GenericRecord } from "@webiny/api/types.js";
declare class NamespaceHandlerExecutionerImpl implements NamespaceHandlerExecutionerAbstraction.Interface {
    private readonly namespaceHandlers;
    constructor(namespaceHandlers: NamespaceHandler.Interface<GenericRecord>[]);
    execute(params: NamespaceHandlerExecutionerAbstraction.Params): NamespaceHandlerExecutionerAbstraction.Response;
}
export declare const NamespaceHandlerExecutioner: typeof NamespaceHandlerExecutionerImpl & {
    __abstraction: import("@webiny/di").Abstraction<import("./abstractions.js").INamespaceHandlerExecutioner>;
};
export {};
