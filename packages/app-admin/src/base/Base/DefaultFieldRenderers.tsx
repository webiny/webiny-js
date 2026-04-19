import React from "react";
import { AdminConfig } from "~/config/AdminConfig.js";
import { InputRenderer } from "~/base/Base/FieldRenderers/InputRenderer.js";
import { SelectRenderer } from "~/base/Base/FieldRenderers/SelectRenderer.js";
import { ObjectRenderer } from "~/base/Base/FieldRenderers/ObjectRenderer/ObjectRenderer.js";
import { PassthroughRenderer } from "~/base/Base/FieldRenderers/PassthroughRenderer.js";
import { ObjectListFlatRenderer } from "~/base/Base/FieldRenderers/ObjectRenderer/ObjectListFlatRenderer.js";
import { TextareaRenderer } from "~/base/Base/FieldRenderers/TextareaRenderer.js";

export const DefaultFieldRenderers = () => {
    return (
        <AdminConfig>
            <AdminConfig.Form.FieldRenderer name={"input"} component={InputRenderer} />
            <AdminConfig.Form.FieldRenderer name={"textarea"} component={TextareaRenderer} />
            <AdminConfig.Form.FieldRenderer name={"dropdown"} component={SelectRenderer} />
            <AdminConfig.Form.FieldRenderer name={"object"} component={ObjectRenderer} />
            <AdminConfig.Form.FieldRenderer name={"passthrough"} component={PassthroughRenderer} />
            <AdminConfig.Form.FieldRenderer
                name={"objectListFlat"}
                component={ObjectListFlatRenderer}
            />
        </AdminConfig>
    );
};
