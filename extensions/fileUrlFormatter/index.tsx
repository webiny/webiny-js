import React from "react";
import { createFeature, RegisterFeature } from "webiny/admin";
import MyFileUrlFormatter from "./MyFileUrlFormatter.js";

const FileUrlFormatterFeature = createFeature({
    name: "MyApp/FileUrlFormatter",
    register(container) {
        container.register(MyFileUrlFormatter).inSingletonScope();
    }
});

export default () => <RegisterFeature feature={FileUrlFormatterFeature} />;
