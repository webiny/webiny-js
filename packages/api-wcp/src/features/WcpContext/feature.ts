import { createFeature } from "@webiny/feature/api";
import type { Container } from "@webiny/di-container";
import { WcpContextImpl } from "./WcpContext.js";
import type { CreateWcpContextParams } from "~/context.js";
import { WcpContext } from "./abstractions.js";

export const WcpContextFeature = createFeature({
    name: "WcpContext",
    register(container: Container, params: CreateWcpContextParams) {
        container.registerInstance(WcpContext, new WcpContextImpl(params));
    }
});
