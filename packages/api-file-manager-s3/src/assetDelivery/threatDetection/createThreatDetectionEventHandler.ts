import type { Container } from "@webiny/feature/api";
import type { EventBridgeEvent } from "@webiny/aws-sdk/types/index.js";
import {
    EventBridgeInputHandler,
    type EventBridgeResult
} from "@webiny/api-kernel-aws/abstractions/handlers/EventBridgeInputHandler.js";
import { RequestContainer } from "@webiny/api-kernel-core";
import { GetTenantByIdUseCase } from "@webiny/api-core/features/tenancy/GetTenantById/index.js";
import type { IGetTenantByIdUseCase } from "@webiny/api-core/features/tenancy/GetTenantById/abstractions.js";
import { TenantScopes } from "@webiny/api-core/features/tenancy/TenantScopes/index.js";
import type { Tenant } from "@webiny/api-core/types/tenancy.js";
import type { InputContext, NextFunction } from "@webiny/api-kernel-core";
import type { ApiCoreContext } from "@webiny/api-core/types/core.js";
import { FeatureFlags } from "@webiny/api-core/features/featureFlags/abstractions.js";
import { GlobalKeyValueStore } from "@webiny/api-core/features/keyValueStore/index.js";
import { processThreatScanResult } from "./processThreatScanResult.js";
import { ObjectKey } from "./ObjectKey.js";
import type { GuardDutyEvent } from "./types.js";

const DETAIL_TYPE = "GuardDuty Malware Protection Object Scan Result";

class ThreatDetectionEventBridgeLambdaHandlerImpl implements EventBridgeInputHandler.Interface {
    constructor(
        private container: Container,
        private tenantScopes: TenantScopes.Interface,
        private getTenantById: IGetTenantByIdUseCase
    ) {}

    async execute(
        inputCtx: InputContext<EventBridgeEvent<string, GuardDutyEvent>>,
        _next: NextFunction
    ): Promise<EventBridgeResult> {
        const payload = inputCtx.input;
        if (payload["detail-type"] !== DETAIL_TYPE) {
            return { success: true };
        }

        if (!this.container.resolve(FeatureFlags).get().isEnabled("fileManager.threatDetection")) {
            return { success: true };
        }

        const objectKey = payload.detail.s3ObjectDetails.objectKey;
        const keyValueStore = this.container.resolve(GlobalKeyValueStore);
        let tenant: Tenant | null = null;

        try {
            const fileId = ObjectKey.from(objectKey).id();
            const result = await keyValueStore.get<{ tenant: string }>(
                `FileManager/File/${fileId}/Metadata`
            );

            if (result.isOk()) {
                const tenantResult = await this.getTenantById.execute(result.value.tenant);
                if (tenantResult.isOk()) {
                    tenant = tenantResult.value;
                }
            }
        } catch {
            // If metadata can't be loaded, ignore — likely a rendition file.
        }

        if (!tenant) {
            await processThreatScanResult(
                { container: this.container } as unknown as ApiCoreContext,
                payload.detail,
                null
            );
            return { success: true };
        }

        // The file is the tenant's: handle it with that tenant's services.
        await this.tenantScopes.withTenant(tenant, async scope => {
            await processThreatScanResult(
                { container: scope.resolve(RequestContainer) } as unknown as ApiCoreContext,
                payload.detail,
                scope.tenant.id
            );
        });
        return { success: true };
    }
}

export const ThreatDetectionEventBridgeLambdaHandler = EventBridgeInputHandler.createImplementation(
    {
        implementation: ThreatDetectionEventBridgeLambdaHandlerImpl,
        dependencies: [RequestContainer, TenantScopes, GetTenantByIdUseCase]
    }
);

/**
 * @deprecated Use ThreatDetectionEventBridgeLambdaHandler instead.
 */
export const createThreatDetectionEventHandler = () => {
    return [];
};
