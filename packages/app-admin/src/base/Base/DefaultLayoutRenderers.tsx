import React from "react";
import { AdminConfig } from "~/config/AdminConfig.js";
import { VerticalTabsRenderer } from "~/base/Base/FieldRenderers/VerticalTabsRenderer.js";
import { HorizontalTabsRenderer } from "~/base/Base/FieldRenderers/HorizontalTabsRenderer.js";

export const DefaultLayoutRenderers = () => {
    return (
        <AdminConfig>
            <AdminConfig.Form.LayoutRenderer
                name={"tabsVertical"}
                component={VerticalTabsRenderer}
            />
            <AdminConfig.Form.LayoutRenderer
                name={"tabsHorizontal"}
                component={HorizontalTabsRenderer}
            />
        </AdminConfig>
    );
};
