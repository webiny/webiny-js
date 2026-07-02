import type { Container } from "@webiny/feature/api";
import type { EventBridgeEvent } from "@webiny/aws-sdk/types/index.js";
import {
    EventBridgeEventHandler,
    type EventBridgeResult
} from "@webiny/event-handler-aws/abstractions/handlers/EventBridgeEventHandler.js";
import { RequestContainer } from "@webiny/event-handler-core";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import { GetTenantByIdUseCase } from "@webiny/api-core/features/tenancy/GetTenantById/index.js";
import type { ITenantContext } from "@webiny/api-core/features/tenancy/TenantContext/abstractions.js";
import type { IGetTenantByIdUseCase } from "@webiny/api-core/features/tenancy/GetTenantById/abstractions.js";
import type { EventContext, NextFunction } from "@webiny/event-handler-core";
import type { ApiCoreContext } from "@webiny/api-core/types/core.js";
import { WcpContext } from "@webiny/api-core/features/wcp/WcpContext/index.js";
import { GlobalKeyValueStore } from "@webiny/api-core/features/keyValueStore/index.js";
import { processThreatScanResult } from "./processThreatScanResult.js";
import { ObjectKey } from "./ObjectKey.js";
import type { GuardDutyEvent } from "./types.js";

const DETAIL_TYPE = "GuardDuty Malware Protection Object Scan Result";

class ThreatDetectionEventBridgeLambdaHandlerImpl implements EventBridgeEventHandler.Interface {
    constructor(
        private container: Container,
        private tenantCtx: ITenantContext,
        private getTenantById: IGetTenantByIdUseCase
    ) {}

    async execute(
        eventCtx: EventContext<EventBridgeEvent<string, GuardDutyEvent>>,
        _next: NextFunction
    ): Promise<EventBridgeResult> {
        const payload = eventCtx.event;
        if (payload["detail-type"] !== DETAIL_TYPE) {
            return { success: true };
        }

        if (!this.container.resolve(WcpContext).canUseFileManagerThreatDetection()) {
            return { success: true };
        }

        const objectKey = payload.detail.s3ObjectDetails.objectKey;
        const keyValueStore = this.container.resolve(GlobalKeyValueStore);

        try {
            const fileId = ObjectKey.from(objectKey).id();
            const result = await keyValueStore.get<{ tenant: string }>(
                `FileManager/File/${fileId}/Metadata`
            );

            if (result.isOk()) {
                const tenantResult = await this.getTenantById.execute(result.value.tenant);
                if (tenantResult.isOk()) {
                    this.tenantCtx.setTenant(tenantResult.value);
                }
            }
        } catch {
            // If metadata can't be loaded, ignore — likely a rendition file.
        }

        await processThreatScanResult(
            { container: this.container } as unknown as ApiCoreContext,
            payload.detail
        );
        return { success: true };
    }
}

export const ThreatDetectionEventBridgeLambdaHandler = EventBridgeEventHandler.createImplementation(
    {
        implementation: ThreatDetectionEventBridgeLambdaHandlerImpl,
        dependencies: [RequestContainer, TenantContext, GetTenantByIdUseCase]
    }
);

/**
 * @deprecated Use ThreatDetectionEventBridgeLambdaHandler instead.
 */
export const createThreatDetectionEventHandler = () => {
    return [];
};
