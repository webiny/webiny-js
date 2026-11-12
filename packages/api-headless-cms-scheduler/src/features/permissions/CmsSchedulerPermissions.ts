import { SchedulerPermissions } from "@webiny/api-scheduler/features/permissions/abstractions.js";
import { IdentityContext } from "@webiny/api-core/exports/api/security.js";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { ListModelsUseCase } from "@webiny/api-headless-cms/features/contentModel/ListModels/index.js";
import { AccessControl } from "@webiny/api-headless-cms/features/shared/abstractions.js";
import type { CmsModel } from "@webiny/api-headless-cms/types/index.js";
import { CMS_NAMESPACE, createNamespace, extractModelIdFromNamespace } from "~/utils/namespace.js";

class CmsSchedulerPermissionsImpl implements SchedulerPermissions.Interface {
    constructor(
        private identityContext: IdentityContext.Interface,
        private getModel: GetModelUseCase.Interface,
        private listModels: ListModelsUseCase.Interface,
        private accessControl: AccessControl.Interface
    ) {}

    canHandle(namespace: string): boolean {
        return namespace.startsWith(CMS_NAMESPACE);
    }

    /**
     * Security: scheduled actions expose entry titles, so reading them requires reading the
     * entries of every model the namespace (or namespace prefix) covers.
     */
    async canRead(params: SchedulerPermissions.Params): Promise<boolean> {
        if (!this.identityContext.isAuthorizationEnabled()) {
            return true;
        }
        if (await this.identityContext.hasFullAccess()) {
            return true;
        }
        const models = await this.getModels(params);
        if (!models.length) {
            return false;
        }
        for (const model of models) {
            if (!(await this.accessControl.canAccessEntry({ model, rwd: "r" }))) {
                return false;
            }
        }
        return true;
    }

    async onlyOwnRecords(): Promise<boolean> {
        if (await this.identityContext.hasFullAccess()) {
            return false;
        }
        const permissions = await this.identityContext.getPermissions("cms.contentEntry");
        if (!permissions.length) {
            return false;
        }
        return !permissions.some((p: any) => !p.own);
    }

    /**
     * Models are loaded without authorization only to evaluate access to them.
     */
    private async getModels(params: SchedulerPermissions.Params): Promise<CmsModel[]> {
        const { namespace, startsWith } = params;
        if (!startsWith) {
            const modelId = extractModelIdFromNamespace(namespace);
            if (!modelId) {
                return [];
            }
            const result = await this.identityContext.withoutAuthorization(() => {
                return this.getModel.execute(modelId);
            });
            return result.isOk() ? [result.value] : [];
        }
        const result = await this.identityContext.withoutAuthorization(() => {
            // Private models can't be scheduled.
            return this.listModels.execute({ includePrivate: false });
        });
        if (result.isFail()) {
            return [];
        }
        return result.value.filter(model => createNamespace(model).startsWith(namespace));
    }
}

export const CmsSchedulerPermissions = SchedulerPermissions.createImplementation({
    implementation: CmsSchedulerPermissionsImpl,
    dependencies: [IdentityContext, GetModelUseCase, ListModelsUseCase, AccessControl]
});
