import { NamespaceHandler as NamespaceHandlerAbstraction } from "@webiny/api-scheduler/exports/api/scheduler.js";
import { extractModelIdFromNamespace } from "~/utils/namespace.js";
import { Result } from "@webiny/feature/exports/api.js";
import type { GenericRecord } from "@webiny/api/types.js";
import { SCHEDULED_ACTION_TYPE_REDIRECT } from "~/constants.js";
import type { IScheduledActionPayload } from "~/types.js";
import { GetRedirectByIdUseCase } from "@webiny/api-website-builder/exports/api/website-builder/redirect.js";

class RedirectNamespaceHandlerImpl implements NamespaceHandlerAbstraction.Interface<GenericRecord> {
    public constructor(private getRedirectByIdUseCase: GetRedirectByIdUseCase.Interface) {}

    public canHandle(namespace: string): boolean {
        const type = extractModelIdFromNamespace(namespace);

        return type === SCHEDULED_ACTION_TYPE_REDIRECT;
    }

    public async execute(
        params: NamespaceHandlerAbstraction.Params
    ): NamespaceHandlerAbstraction.Response<IScheduledActionPayload> {
        const type = extractModelIdFromNamespace(params.namespace)!;

        const redirectResult = await this.getRedirectByIdUseCase.execute(params.targetId);
        if (redirectResult.isFail()) {
            return Result.fail(redirectResult.error as any);
        }
        const redirect = redirectResult.value;

        const title = redirect.redirectFrom || "Unknown redirect title";

        return Result.ok({
            namespace: params.namespace,
            title,
            type,
            actionType: params.actionType,
            targetId: params.targetId,
            scheduleId: params.scheduleId,
            immediately: params.immediately || false
        });
    }
}

export const RedirectNamespaceHandler = NamespaceHandlerAbstraction.createImplementation({
    implementation: RedirectNamespaceHandlerImpl,
    dependencies: [GetRedirectByIdUseCase]
});
