import React from "react";
import { createFeature, RegisterFeature } from "webiny/admin";
import { MyFileUrlFormatterImpl } from "./MyFileUrlFormatter.js";

const FileUrlFormatterFeature = createFeature({
    name: "MyApp/FileUrlFormatter",
    register(container) {
        container.register(MyFileUrlFormatterImpl).inSingletonScope();
    }
});

export default () => <RegisterFeature feature={FileUrlFormatterFeature} />;
