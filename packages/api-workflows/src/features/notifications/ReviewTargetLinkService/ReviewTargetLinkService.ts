import { Logger } from "@webiny/api-core/features/logger/index.js";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import type { PersistenceErrorSource } from "~/domain/PersistenceErrorSource.js";
import { WorkflowsAdminUrlService } from "~/features/notifications/WorkflowsAdminUrlService/abstractions.js";
import { ReviewTargetLink } from "~/features/notifications/ReviewTargetLink/abstractions.js";
import { ReviewTargetLinkService as Abstraction } from "./abstractions.js";

class ReviewTargetLinkServiceImpl implements Abstraction.Interface {
    public constructor(
        private adminUrl: WorkflowsAdminUrlService.Interface,
        private tenantContext: TenantContext.Interface,
        private logger: Logger.Interface,
        private links: ReviewTargetLink.Interface[]
    ) {}

    public async getUrl(params: ReviewTargetLink.Params): Promise<string | null> {
        try {
            // Several adapters may match; the last registered wins, like `ReviewTargetEditorService`.
            const link = [...this.links].reverse().find(item => item.canLink(params.model));
            if (!link) {
                return null;
            }
            const adminUrl = await this.adminUrl.get();
            if (!adminUrl) {
                return null;
            }
            // The tenant the review lives in: the admin's `TenancyProvider` opens it from the
            // `tenantId` query parameter. No tenant, no link (never a link without `tenantId`).
            const tenantId = this.tenantContext.getTenant()?.id;
            if (!tenantId) {
                return null;
            }

            // String concatenation only: the adapter's encoded path (`%23`) is never re-serialised.
            const path = link.getPath(params);
            const separator = path.includes("?") ? "&" : "?";
            return `${adminUrl}${path}${separator}tenantId=${encodeURIComponent(tenantId)}`;
        } catch (error) {
            // Code and name only: the message of a port or tenant error is not ours to print.
            const source: PersistenceErrorSource =
                error instanceof Error ? error : new Error(String(error));
            this.logger.error(
                {
                    errorCode: source.code,
                    errorName: source.name,
                    model: params.model,
                    targetId: params.targetId
                },
                "Could not build the workflow notification link."
            );
            return null;
        }
    }
}

export const ReviewTargetLinkService = Abstraction.createImplementation({
    implementation: ReviewTargetLinkServiceImpl,
    dependencies: [
        WorkflowsAdminUrlService,
        TenantContext,
        Logger,
        [ReviewTargetLink, { multiple: true }]
    ]
});
