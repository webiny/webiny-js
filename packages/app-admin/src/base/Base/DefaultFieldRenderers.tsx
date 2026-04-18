import React from "react";
import { AdminConfig } from "~/config/AdminConfig.js";
import { TextRenderer } from "~/base/Base/FieldRenderers/TextRenderer.js";
import { SelectRenderer } from "~/base/Base/FieldRenderers/SelectRenderer.js";
import { ObjectRenderer } from "~/base/Base/FieldRenderers/ObjectRenderer.js";
import { PassthroughRenderer } from "~/base/Base/FieldRenderers/PassthroughRenderer.js";
import { ObjectListFlatRenderer } from "~/base/Base/FieldRenderers/ObjectListFlatRenderer.js";

export const DefaultFieldRenderers = () => {
    return (
        <AdminConfig>
            <AdminConfig.Form.FieldRenderer name={"text"} component={TextRenderer} />
            <AdminConfig.Form.FieldRenderer name={"select"} component={SelectRenderer} />
            <AdminConfig.Form.FieldRenderer name={"object"} component={ObjectRenderer} />
            <AdminConfig.Form.FieldRenderer name={"passthrough"} component={PassthroughRenderer} />
            <AdminConfig.Form.FieldRenderer
                name={"objectListFlat"}
                component={ObjectListFlatRenderer}
            />
        </AdminConfig>
    );
};
