import { createCmsTestHandler } from "@webiny/api-headless-cms-testing";
import type { CmsTestHandlerParams } from "@webiny/api-headless-cms-testing";
import { getStorageOps } from "@webiny/project-utils/testing/environment/index.js";
import { BackgroundTasksFeature, TaskService } from "@webiny/background-tasks/api";
import { createMockTaskService } from "@webiny/project-utils/testing/tasks/mockTaskTriggerTransportPlugin.js";
import { CompressionFeature } from "@webiny/utils/features/compression/feature.js";
import { createTestWcpLicense } from "@webiny/wcp/testing/createTestWcpLicense.js";
import { FileModel } from "@webiny/api-file-manager/domain/file/file.model.js";
import { AcoFeature } from "@webiny/api-aco";
import { AuditLogsFeature } from "~/index";
import { processLegacyPlugins } from "./bridgeLegacyPlugins";
import type { AuditLogsContext } from "~/types";
import type { IdentityData } from "@webiny/api-core/features/security/IdentityContext/index.js";
import type { SecurityPermission } from "@webiny/api-core/types/security.js";

export interface UseHandlerParams {
    permissions?: SecurityPermission[];
    identity?: IdentityData | null;
}

export const useHandler = (params: UseHandlerParams = {}) => {
    const { permissions, identity } = params;

    const apiAcoStorage = getStorageOps<any>("aco");
    const auditLogsStorage = getStorageOps<any>("auditLogs");

    const testProjectLicense = createTestWcpLicense();
    testProjectLicense.package.features["auditLogs"].enabled = true;

    const handlerParams: CmsTestHandlerParams = {
        permissions,
        // preserve the legacy behavior: null identity → default admin (this harness has no anon path)
        identity: identity ?? undefined,
        // aco storage plugins are processed during setup (before HeadlessCmsFeature)
        plugins: apiAcoStorage.plugins,
        testProjectLicense,
        features: container => {
            // Background tasks were registered globally by the retired useContextHandler; keep them
            // (AcoFeature/AuditLogsFeature rely on the TasksCrud aggregate) with the mock transport.
            BackgroundTasksFeature.register(container);
            // CompressionFeature must be registered before the audit logs DDB legacy plugin runs,
            // because that plugin eagerly resolves CompressionHandler from the container.
            CompressionFeature.register(container);
            processLegacyPlugins(container, auditLogsStorage.plugins);
            container.register(FileModel);
            AcoFeature.register(container);
            AuditLogsFeature.register(container);
            container.registerInstance(TaskService, createMockTaskService());
        }
    };

    const inner = createCmsTestHandler(handlerParams);

    return {
        identity: inner.identity,
        tenant: inner.tenant,
        handler: () => inner.getContext<AuditLogsContext>()
    };
};
