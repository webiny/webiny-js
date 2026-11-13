import { describe, expect, it } from "vitest";
import { getAuditConfig } from "~/utils/getAuditConfig.js";
import { useHandler } from "~tests/helpers/useHandler.js";
import { AUDIT } from "~/config.js";
import { GetAuditLogUseCase } from "~/features/GetAuditLog/index.js";
import { ListAuditLogsUseCase } from "~/features/ListAuditLogs/index.js";
import type { PermissionsArg } from "~tests/helpers/helpers.js";
import type { IAuditLog } from "~/storage/types.js";

const createFileCreateAuditLog = getAuditConfig(AUDIT.FILE_MANAGER.FILE.CREATE);

const createAuditLog = async (): Promise<IAuditLog> => {
    const { handler } = useHandler();
    const context = await handler();

    const auditLog = await createFileCreateAuditLog(
        "File created",
        { fileName: "test.jpg" },
        "file#0001",
        context
    );

    return auditLog as IAuditLog;
};

const useUseCases = async (permissions: PermissionsArg[]) => {
    const { handler } = useHandler({ permissions });
    const context = await handler();

    return {
        getAuditLog: context.container.resolve(GetAuditLogUseCase),
        listAuditLogs: context.container.resolve(ListAuditLogsUseCase)
    };
};

describe("reading audit logs - permissions", () => {
    it.each([[[{ name: "*" }]], [[{ name: "al.*" }]]])(
        "should list and get audit logs with %j",
        async permissions => {
            const auditLog = await createAuditLog();
            const { getAuditLog, listAuditLogs } = await useUseCases(permissions);

            const listResult = await listAuditLogs.execute({});
            expect(listResult.isOk()).toBe(true);
            expect(listResult.value.items.map(item => item.id)).toEqual([auditLog.id]);

            const getResult = await getAuditLog.execute(auditLog.id);
            expect(getResult.isOk()).toBe(true);
            expect(getResult.value?.id).toEqual(auditLog.id);
        }
    );

    it.each([[[{ name: "cms.settings" }]], [[{ name: "al.CREATE" }]]])(
        "should not list or get audit logs with %j",
        async permissions => {
            const auditLog = await createAuditLog();
            const { getAuditLog, listAuditLogs } = await useUseCases(permissions);

            const listResult = await listAuditLogs.execute({});
            expect(listResult.isFail()).toBe(true);
            expect(listResult.error).toMatchObject({
                code: "NOT_AUTHORIZED",
                message: "You cannot access audit logs."
            });

            const getResult = await getAuditLog.execute(auditLog.id);
            expect(getResult.isFail()).toBe(true);
            expect(getResult.error).toMatchObject({
                code: "NOT_AUTHORIZED",
                message: "You cannot access audit logs."
            });
        }
    );

    it("should not reveal whether an audit log exists to a caller without permission", async () => {
        const { getAuditLog } = await useUseCases([{ name: "cms.settings" }]);

        const result = await getAuditLog.execute("unknown-id");

        expect(result.isFail()).toBe(true);
        expect(result.error).toMatchObject({
            code: "NOT_AUTHORIZED",
            message: "You cannot access audit logs."
        });
    });
});
