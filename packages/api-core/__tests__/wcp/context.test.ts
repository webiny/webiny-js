import { describe, expect, it } from "vitest";
import { Context, ContextPlugin } from "@webiny/api";
import { createWcpContext } from "~/context.js";
import type { WcpContext as IWcpContext } from "~/types.js";
import { createTestWcpLicense } from "@webiny/wcp/testing/createTestWcpLicense.js";
import { WcpContext } from "~/features/WcpContext";

describe("context", () => {
    it("should create wcp on the context", async () => {
        const context = new Context({
            plugins: [],
            WEBINY_VERSION: "w.w.w"
        }) as unknown as Partial<IWcpContext> & Context;

        const testProjectLicense = createTestWcpLicense();

        context.plugins.register(createWcpContext({ testProjectLicense }));

        for (const pl of context.plugins.byType<ContextPlugin>(ContextPlugin.type)) {
            await pl.apply(context);
        }

        expect(context.wcp).toMatchObject({
            getProjectLicense: expect.any(Function),
            getProject: expect.any(Function),
            getRawLicense: expect.any(Function),
            getProjectEnvironment: expect.any(Function),
            canUseAacl: expect.any(Function),
            canUseFeature: expect.any(Function),
            ensureCanUseFeature: expect.any(Function),
            incrementSeats: expect.any(Function),
            canUseFolderLevelPermissions: expect.any(Function),
            canUseFileManagerThreatDetection: expect.any(Function),
            canUsePrivateFiles: expect.any(Function),
            canUseTeams: expect.any(Function),
            canUseAuditLogs: expect.any(Function),
            canUseRecordLocking: expect.any(Function),
            decrementSeats: expect.any(Function),
            incrementTenants: expect.any(Function),
            decrementTenants: expect.any(Function),
            canUseWorkflows: expect.any(Function)
        });

        // Test legacy context
        const project = context.wcp!.getProject();
        expect(project).toMatchObject(testProjectLicense);

        // Test WcpContext feature
        const wcpContext = context.container.resolve(WcpContext);
        expect(wcpContext.getProject()).toMatchObject(testProjectLicense);
    });
});
