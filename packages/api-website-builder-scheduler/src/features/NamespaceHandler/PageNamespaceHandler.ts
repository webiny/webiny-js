import { NamespaceHandler as NamespaceHandlerAbstraction } from "@webiny/api-scheduler/exports/api/scheduler.js";
import { extractModelIdFromNamespace } from "~/utils/namespace.js";
import { Result } from "@webiny/feature/exports/api.js";
import type { GenericRecord } from "@webiny/api/types.js";
import { SCHEDULED_ACTION_TYPE_PAGE } from "~/constants.js";
import type { IScheduledActionPayload } from "~/types.js";
import { GetPageByIdUseCase } from "@webiny/api-website-builder/exports/api/website-builder/page.js";

class PageNamespaceHandlerImpl implements NamespaceHandlerAbstraction.Interface<GenericRecord> {
    public constructor(private getPageByIdUseCase: GetPageByIdUseCase.Interface) {}

    public canHandle(namespace: string): boolean {
        const type = extractModelIdFromNamespace(namespace);
        return type === SCHEDULED_ACTION_TYPE_PAGE;
    }

    public async execute(
        params: NamespaceHandlerAbstraction.Params
    ): NamespaceHandlerAbstraction.Response<IScheduledActionPayload> {
        const type = extractModelIdFromNamespace(params.namespace)!;

        const pageResult = await this.getPageByIdUseCase.execute(params.targetId);
        if (pageResult.isFail()) {
            return Result.fail(pageResult.error as any);
        }
        const page = pageResult.value;

        const title = page.properties.title || "Unknown page title";

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

export const PageNamespaceHandler = NamespaceHandlerAbstraction.createImplementation({
    implementation: PageNamespaceHandlerImpl,
    dependencies: [GetPageByIdUseCase]
});
