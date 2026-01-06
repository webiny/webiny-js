import React from "react";
import { AdminConfig } from "webiny/admin/configs.js";
import { AiTextWriterWidget } from "./presentation/AiTextWriterWidget/AiTextWriterWidget.js";
import { RegisterFeature } from "@webiny/app-admin/components/RegisterFeature.js";
import { AiPromptFeature } from "./features/aiPrompt/feature.js";
import { AiTextWriterWidgetFeature } from "./presentation/AiTextWriterWidget/feature.js";

const { Dashboard } = AdminConfig;

export const Extension = () => {
    return (
        <>
            <RegisterFeature feature={AiPromptFeature}/>
            <RegisterFeature feature={AiTextWriterWidgetFeature}/>
            <AdminConfig>
                <Dashboard.Widget
                    name={"ai-text-writer"}
                    element={<AiTextWriterWidget />}
                    pin={"first"}
                />
            </AdminConfig>
        </>
    );
};
