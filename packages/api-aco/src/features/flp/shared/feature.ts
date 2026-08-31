import { type Container, createFeature } from "@webiny/feature/api";
import { FeatureFlags } from "@webiny/api-core/features/featureFlags/abstractions.js";
import { FlpProvider } from "./FlpProvider.js";
import { GetFlpWithCodeFlps } from "~/features/flp/GetFlp/decorators/GetFlpWithCodeFlps.js";
import { ListFlpsWithCodeFlps } from "~/features/flp/ListFlps/decorators/ListFlpsWithCodeFlps.js";

export const CodeFlpsFeature = createFeature({
    name: "CodeFlps",
    register(container: Container) {
        // Code-defined FLPs are part of folder-level permissions, which is license-gated. Check at
        // register time so nothing wires up — and no code permission is ever enforced — without the
        // entitlement.
        if (
            !container
                .resolve(FeatureFlags)
                .get()
                .isEnabled("advancedAccessControlLayer.folderLevelPermissions")
        ) {
            return;
        }

        container.register(FlpProvider).inSingletonScope();
        container.registerDecorator(GetFlpWithCodeFlps);
        container.registerDecorator(ListFlpsWithCodeFlps);
    }
});
