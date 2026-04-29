import React from "react";
import { observer } from "mobx-react-lite";
import type { IFieldVM, IObjectFieldVM } from "~/features/formModel/index.js";
import { LayoutNodeRenderer } from "~/features/formModel/FormView.js";

declare module "../../../features/formModel/abstractions.js" {
    interface IFieldRendererRegistry {
        passthrough: { fieldType: string; settings: undefined };
    }
}

const isObjectFieldVM = (field: IFieldVM): field is IObjectFieldVM => {
    return field.type === "object";
};

export const PassthroughRenderer = observer(({ field }: { field: IFieldVM }) => {
    if (!isObjectFieldVM(field)) {
        return null;
    }

    return (
        <div className="flex flex-col gap-4">
            {field.layout.map((node, index) => (
                <LayoutNodeRenderer key={index} node={node} />
            ))}
        </div>
    );
});
