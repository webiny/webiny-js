import { NamespaceHandler as NamespaceHandlerAbstraction } from "~/features/NamespaceHandler/index.js";
import { PublishTestEntryActionHandlerImpl } from "./PublishTestEntryActionHandler";
import { Result } from "@webiny/feature/api/index.js";

interface TestingNamespaceHandlerResult {
    something: boolean;
    title: string;
}

class NamespaceHandlerImpl implements NamespaceHandlerAbstraction.Interface<TestingNamespaceHandlerResult> {
    public canHandle(namespace: string): boolean {
        return namespace === PublishTestEntryActionHandlerImpl.name;
    }

    public async execute(
        params: NamespaceHandlerAbstraction.Params
    ): NamespaceHandlerAbstraction.Response<TestingNamespaceHandlerResult> {
        return Result.ok({
            targetId: params.targetId,
            actionType: params.actionType,
            namespace: params.namespace,
            scheduleId: params.scheduleId,
            something: true,
            title: "Fetched title from handler"
        });
    }
}

export const NamespaceHandler = NamespaceHandlerAbstraction.createImplementation({
    implementation: NamespaceHandlerImpl,
    dependencies: []
});
