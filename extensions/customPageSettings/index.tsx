import React from "react";
import { createFeature, RegisterFeature } from "webiny/admin";
import { PublishingSettingsGroup } from "./PublishingSettingsGroup.js";
import { GeneralSettingsModifier } from "./GeneralSettingsModifier.js";

const CustomPageSettingsFeature = createFeature({
    name: "CustomPageSettings",
    register(container) {
        container.register(PublishingSettingsGroup);
        container.register(GeneralSettingsModifier);
    }
});

export default () => {
    return <RegisterFeature feature={CustomPageSettingsFeature} />;
};
