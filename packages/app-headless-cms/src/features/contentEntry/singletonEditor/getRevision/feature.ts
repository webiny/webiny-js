import { createFeature } from "@webiny/feature/admin";
import { GetEntryGatewaySingletonDecorator } from "./GetEntryGatewaySingletonDecorator.js";

export const GetSingletonEntryRevisionFeature = createFeature({
    name: "CmsContentEntry/GetSingletonEntryRevision",
    register(container) {
        container.registerDecorator(GetEntryGatewaySingletonDecorator);
    }
});
