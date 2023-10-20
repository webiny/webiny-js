import { ContextPlugin } from "@webiny/api";
import { Context } from "@webiny/api";
import { createWcpContext } from "~/context";
import { WcpContext } from "~/types";

describe("context", () => {
    it("should create wcp on the context", async () => {
        const context = new Context({
            plugins: [],
            WEBINY_VERSION: "w.w.w"
        }) as unknown as Partial<WcpContext> & Context;
        context.plugins.register(createWcpContext());

        for (const pl of context.plugins.byType<ContextPlugin>(ContextPlugin.type)) {
            await pl.apply(context);
        }

        expect(context.wcp).toEqual({
            canUseAacl: expect.any(Function),
            getProjectLicense: expect.any(Function),
            getProjectEnvironment: expect.any(Function),
            canUseFeature: expect.any(Function),
            ensureCanUseFeature: expect.any(Function),
            incrementSeats: expect.any(Function),
            canUseFolderLevelPermissions: expect.any(Function),
            canUsePrivateFiles: expect.any(Function),
            canUseTeams: expect.any(Function),
            decrementSeats: expect.any(Function),
            incrementTenants: expect.any(Function),
            decrementTenants: expect.any(Function)
        });
    });
});
