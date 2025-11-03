import { createFeature } from "@webiny/feature/api";
import type { Container } from "@webiny/di";
import { WcpContextImpl } from "./WcpContext.js";
import { WcpContext } from "./abstractions.js";
import type { ILicense } from "@webiny/wcp/types.js";

export const WcpContextFeature = createFeature({
    name: "WcpContext",
    register(container: Container, license: ILicense) {
        container.registerInstance(WcpContext, new WcpContextImpl(license));
    }
});
