import React from "react";
import { AdminConfig } from "~/config/AdminConfig.js";
import { VerticalTabsRenderer } from "~/base/Base/FieldRenderers/VerticalTabsRenderer.js";

export const DefaultLayoutRenderers = () => {
    return (
        <AdminConfig>
            <AdminConfig.Form.LayoutRenderer
                name={"tabs-vertical"}
                component={VerticalTabsRenderer}
            />
        </AdminConfig>
    );
};
