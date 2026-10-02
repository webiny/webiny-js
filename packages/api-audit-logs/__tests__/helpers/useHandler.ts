import { createCmsTestHandler } from "@webiny/api-headless-cms-testing";
import type { CmsTestHandlerParams } from "@webiny/api-headless-cms-testing";
import { getStorageOps } from "@webiny/api-core/testing/environment.js";
import { CompressionFeature } from "@webiny/utils/features/compression/feature.js";
import { createTestWcpLicense } from "@webiny/wcp/testing/createTestWcpLicense.js";
import { FileModel } from "@webiny/api-file-manager/domain/file/file.model.js";
import { AcoFeature } from "@webiny/api-aco";
import { AuditLogsFeature } from "~/index";
import { processLegacyPlugins } from "./bridgeLegacyPlugins";
import type { Container } from "@webiny/di";
import { RecordAuditLogUseCase } from "~/features/RecordAuditLog/abstractions";
import { ListAuditLogsUseCase } from "~/features/ListAuditLogs/abstractions";
import type { IListAuditLogsParams } from "~/types";
import type { IAuditLog } from "~/storage/types";
import type { IdentityData } from "@webiny/api-core/features/security/IdentityContext/index.js";
import type { SecurityPermission } from "@webiny/api-core/types/security.js";

export interface AuditLogsTestContext {
    container: Container;
    // Records an audit log through RecordAuditLogUseCase, throwing if it fails.
    recordAuditLog(input: RecordAuditLogUseCase.Input): Promise<IAuditLog | null>;
    // Lists audit logs through ListAuditLogsUseCase, throwing if it fails.
    listAuditLogs(params: IListAuditLogsParams): Promise<ListAuditLogsUseCase.Output>;
}

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
        legacyPlugins: apiAcoStorage.plugins,
        testProjectLicense,
        setup: container => {
            // CompressionFeature must be registered before the audit logs DDB legacy plugin runs,
            // because that plugin eagerly resolves CompressionHandler from the container.
            CompressionFeature.register(container);
            processLegacyPlugins(container, auditLogsStorage.plugins);
            container.register(FileModel);
            AcoFeature.register(container);
            AuditLogsFeature.register(container);
        }
    };

    const inner = createCmsTestHandler(handlerParams);

    return {
        identity: inner.identity,
        tenant: inner.tenant,
        invoke: inner.invoke,
        handler: async (): Promise<AuditLogsTestContext> => {
            const { container } = await inner.getContext<{ container: Container }>();
            return {
                container,
                recordAuditLog: async input => {
                    const result = await container.resolve(RecordAuditLogUseCase).execute(input);
                    if (result.isFail()) {
                        throw result.error;
                    }
                    return result.value;
                },
                listAuditLogs: async params => {
                    const result = await container.resolve(ListAuditLogsUseCase).execute(params);
                    if (result.isFail()) {
                        throw result.error;
                    }
                    return result.value;
                }
            };
        }
    };
};
