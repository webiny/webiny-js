import { ContextPlugin } from "@webiny/api";
import type { Context as BaseContext } from "@webiny/handler/types";
import type { SecurityContext } from "~/types/security.js";

interface Context extends BaseContext, SecurityContext {}

export const createRootTenantMock = () => {
    return new ContextPlugin<Context>(context => {
        // @ts-expect-error
        context.tenancy.setCurrentTenant({
            id: "root",
            name: "Root",
            isInstalled: true,
            parent: null,
            tags: []
        });
    });
};
