import React from "react";
import { createObjectFieldRenderer } from "~/features/formModel/createFieldRenderer.js";
import { LayoutNodeRenderer } from "~/features/formModel/FormView.js";

declare module "../../../features/formModel/abstractions.js" {
    interface IFieldRendererRegistry {
        passthrough: { fieldType: string; settings: undefined };
    }
}

export const PassthroughRenderer = createObjectFieldRenderer(({ field }) => {
    return (
        <div className="flex flex-col gap-4">
            {field.layout.map((node, index) => (
                <LayoutNodeRenderer key={index} node={node} />
            ))}
        </div>
    );
});
