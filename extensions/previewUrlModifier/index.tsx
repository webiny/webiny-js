import React from "react";
import { createFeature, RegisterFeature } from "webiny/admin";
import MyPreviewUrlModifier from "./MyPreviewUrlModifier.js";

const PreviewUrlModifierFeature = createFeature({
    name: "MyApp/PreviewUrlModifier",
    register(container) {
        container.register(MyPreviewUrlModifier);
    }
});

export default () => <RegisterFeature feature={PreviewUrlModifierFeature} />;
