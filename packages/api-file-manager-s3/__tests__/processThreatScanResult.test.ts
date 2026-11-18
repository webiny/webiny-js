import { describe, it, expect } from "vitest";
import { Container } from "@webiny/di";
import { Result } from "@webiny/feature/api";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/abstractions.js";
import type { ApiCoreContext } from "@webiny/api-core/types/core.js";
import {
    WebsocketsListConnectionsUseCase,
    WebsocketsSendToConnectionsUseCase,
    ConnectionRegistry
} from "@webiny/api-websockets/exports/api.js";
import { GetFileUseCase } from "@webiny/api-file-manager/features/file/GetFile/index.js";
import { UpdateFileUseCase } from "@webiny/api-file-manager/features/file/UpdateFile/index.js";
import { DeleteFileUseCase } from "@webiny/api-file-manager/features/file/DeleteFile/index.js";
import { processThreatScanResult } from "~/assetDelivery/threatDetection/processThreatScanResult.js";
import type { GuardDutyEvent } from "~/assetDelivery/threatDetection/types.js";

const FILE_ID = "6a44f74cceb47b00022d4d84";

const createConnection = (connectionId: string, tenant: string): ConnectionRegistry.Data => {
    return {
        connectionId,
        tenant,
        endpoint: "https://test.execute-api.us-east-1.amazonaws.com/dev",
        connectedOn: new Date().toISOString(),
        identity: { id: `${connectionId}-identity`, displayName: connectionId, type: "admin" }
    };
};

const connections = [createConnection("root-1", "root"), createConnection("other-1", "other")];

const createEvent = (
    scanResultStatus: GuardDutyEvent["scanResultDetails"]["scanResultStatus"]
): GuardDutyEvent => {
    return {
        scanResultDetails: { scanResultStatus },
        s3ObjectDetails: {
            bucketName: "bucket",
            objectKey: `tenants/root/files/${FILE_ID}/image.png`
        }
    };
};

function setup(tenantId: string | null) {
    const sent: string[][] = [];
    const container = new Container();

    container.registerInstance(TenantContext, {
        getTenant: () => (tenantId ? { id: tenantId, name: tenantId } : null),
        setTenant: () => {
            // no-op for the test
        }
    } as unknown as TenantContext.Interface);
    container.registerInstance(IdentityContext, {
        withoutAuthorization: (cb: () => Promise<unknown>) => cb()
    } as unknown as IdentityContext.Interface);
    container.registerInstance(WebsocketsListConnectionsUseCase, {
        async execute(params?: WebsocketsListConnectionsUseCase.Params) {
            const tenant = params?.where?.tenant;
            return Result.ok(tenant ? connections.filter(c => c.tenant === tenant) : connections);
        }
    });
    container.registerInstance(WebsocketsSendToConnectionsUseCase, {
        async execute(targets: Pick<ConnectionRegistry.Data, "connectionId">[]) {
            sent.push(targets.map(target => target.connectionId));
            return Result.ok();
        }
    } as unknown as WebsocketsSendToConnectionsUseCase.Interface);
    container.registerInstance(GetFileUseCase, {
        async execute() {
            return Result.ok({ id: FILE_ID, name: "image.png", tags: ["threatScanInProgress"] });
        }
    } as unknown as GetFileUseCase.Interface);
    container.registerInstance(UpdateFileUseCase, {
        async execute() {
            return Result.ok();
        }
    } as unknown as UpdateFileUseCase.Interface);
    container.registerInstance(DeleteFileUseCase, {
        async execute() {
            return Result.ok();
        }
    } as unknown as DeleteFileUseCase.Interface);

    const context = { container } as unknown as ApiCoreContext;
    return { context, sent };
}

describe("processThreatScanResult", () => {
    it("sends the scan result only to connections in the file's tenant", async () => {
        const { context, sent } = setup("root");

        await processThreatScanResult(context, createEvent("THREATS_FOUND"));

        expect(sent).toEqual([["root-1"]]);
    });

    it("sends nothing when there is no current tenant", async () => {
        const { context, sent } = setup(null);

        await processThreatScanResult(context, createEvent("NO_THREATS_FOUND"));

        expect(sent.flat()).toEqual([]);
    });
});
