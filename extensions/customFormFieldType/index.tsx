import React from "react";
import { createFeature, RegisterFeature, AdminConfig } from "webiny/admin";
import { MonthFieldType } from "./MonthFieldType.js";
import { MonthRenderer } from "./MonthRenderer.js";

const CustomFormFieldTypeFeature = createFeature({
    name: "CustomFormFieldType",
    register(container) {
        container.register(MonthFieldType);
    }
});

export default () => {
    return (
        <>
            <RegisterFeature feature={CustomFormFieldTypeFeature} />
            <AdminConfig>
                <AdminConfig.Form.FieldRenderer name={"monthInput"} component={MonthRenderer} />
            </AdminConfig>
        </>
    );
};
