import { NamespaceHandler as NamespaceHandlerAbstraction } from "~/features/NamespaceHandler/index.js";
import { PublishTestEntryActionHandlerImpl } from "./PublishTestEntryActionHandler";
import { Result } from "@webiny/feature/api/index.js";

class NamespaceHandlerImpl implements NamespaceHandlerAbstraction.Interface {
    public canHandle(namespace: string): boolean {
        return namespace === PublishTestEntryActionHandlerImpl.name;
    }

    public async execute(
        params: NamespaceHandlerAbstraction.Params
    ): NamespaceHandlerAbstraction.Response {
        return Result.ok({
            ...params,
            something: true,
            title: "Fetched title from handler",
        });
    }
}

export const NamespaceHandler = NamespaceHandlerAbstraction.createImplementation({
    implementation: NamespaceHandlerImpl,
    dependencies: []
});
