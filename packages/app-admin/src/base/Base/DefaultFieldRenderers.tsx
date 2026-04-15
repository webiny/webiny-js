import React from "react";
import { AdminConfig } from "~/config/AdminConfig.js";
import { TextRenderer } from "~/base/Base/FieldRenderers/TextRenderer.js";
import { SelectRenderer } from "~/base/Base/FieldRenderers/SelectRenderer.js";

export const DefaultFieldRenderers = () => {
    return (
        <AdminConfig>
            <AdminConfig.Form.FieldRenderer name={"text"} component={TextRenderer} />
            <AdminConfig.Form.FieldRenderer name={"select"} component={SelectRenderer} />
        </AdminConfig>
    );
};
