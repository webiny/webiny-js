import React from "react";
import { observer } from "mobx-react-lite";
import type { IFormVM, LayoutNodeVM, IRowNodeVM, IFieldVM } from "./abstractions.js";
import { useFieldRenderers } from "~/features/formModel/useFieldRenderers.js";

/**
 * A field renderer component receives a FieldVM and renders the appropriate UI.
 */
export type FieldRendererComponent = React.ComponentType<{ field: IFieldVM }>;

/**
 * Map of renderer keys to React components.
 * Lookup order: `{type}:{renderer}` → `{type}`.
 */
export type FieldRenderers = Record<string, FieldRendererComponent>;

interface FormViewProps {
    form: IFormVM;
    renderers?: FieldRenderers;
}

/**
 * Generic form view that walks layout nodes and renders fields.
 * This component is stateless — it reads from the FormVM and delegates to renderers.
 */
export const FormView = observer(function FormView({ form, renderers }: FormViewProps) {
    const fieldRenderers = useFieldRenderers();

    return (
        <div className="w-full flex flex-col gap-4">
            {form.layout.map((node, index) => (
                <LayoutNodeRenderer
                    key={index}
                    node={node}
                    renderers={renderers ?? fieldRenderers}
                />
            ))}
        </div>
    );
});

interface LayoutNodeRendererProps {
    node: LayoutNodeVM;
    renderers: FieldRenderers;
}

const LayoutNodeRenderer = observer(function LayoutNodeRenderer({
    node,
    renderers
}: LayoutNodeRendererProps) {
    switch (node.type) {
        case "row":
            return <RowNodeRenderer node={node} renderers={renderers} />;
        default:
            return null;
    }
});

interface RowNodeRendererProps {
    node: IRowNodeVM;
    renderers: FieldRenderers;
}

const RowNodeRenderer = observer(function RowNodeRenderer({
    node,
    renderers
}: RowNodeRendererProps) {
    return (
        <div className="grid grid-cols-12 gap-4">
            {node.fields.map(field => {
                const span = Math.floor(12 / node.fields.length);
                return (
                    <div key={field.name} className={`col-span-${span}`}>
                        <FieldRenderer field={field} renderers={renderers} />
                    </div>
                );
            })}
        </div>
    );
});

interface FieldRendererProps {
    field: IFieldVM;
    renderers: FieldRenderers;
}

const FieldRenderer = observer(function FieldRenderer({ field, renderers }: FieldRendererProps) {
    const Renderer = field.renderer ? renderers[field.renderer] : undefined;

    if (!Renderer) {
        if (process.env.NODE_ENV === "development") {
            console.warn(
                `[FormView] No renderer found for field "${field.name}" (renderer: "${field.renderer || "none"}").`
            );
        }
        return null;
    }

    return <Renderer field={field} />;
});
