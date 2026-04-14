import React from "react";
import { observer } from "mobx-react-lite";
import type {
    IFormVM,
    LayoutNodeVM,
    IRowNodeVM,
    IFieldVM,
    ISeparatorNodeVM,
    ITabsNodeVM,
    ITabDefinitionVM,
    IElementNodeVM
} from "./abstractions.js";
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
        case "separator":
            return <SeparatorNodeRenderer />;
        case "tabs":
            return <TabsNodeRenderer node={node} renderers={renderers} />;
        case "element":
            return <ElementNodeRenderer node={node} renderers={renderers} />;
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

const SeparatorNodeRenderer = observer(function SeparatorNodeRenderer() {
    return <hr className="border-neutral-dimmed my-2" />;
});

interface TabsNodeRendererProps {
    node: ITabsNodeVM;
    renderers: FieldRenderers;
}

const TabsNodeRenderer = observer(function TabsNodeRenderer({
    node,
    renderers
}: TabsNodeRendererProps) {
    const activeTab = node.tabs.find(t => t.id === node.activeTabId);

    return (
        <div>
            <div className="flex border-b border-neutral-dimmed">
                {node.tabs.map(tab => (
                    <button
                        key={tab.id}
                        type="button"
                        className={`px-4 py-2 text-sm font-medium border-b-2 ${
                            tab.id === node.activeTabId
                                ? "border-primary text-primary"
                                : "border-transparent text-neutral hover:text-neutral-strong"
                        }`}
                        onClick={() => node.setActiveTab(tab.id)}
                    >
                        {tab.label}
                        {tab.hasErrors && (
                            <span className="ml-1 text-destructive text-xs">*</span>
                        )}
                    </button>
                ))}
            </div>
            {activeTab && (
                <div className="pt-4">
                    {activeTab.description && (
                        <p className="text-sm text-neutral mb-4">{activeTab.description}</p>
                    )}
                    <div className="flex flex-col gap-4">
                        {activeTab.layout.map((childNode, index) => (
                            <LayoutNodeRenderer
                                key={index}
                                node={childNode}
                                renderers={renderers}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
});

interface ElementNodeRendererProps {
    node: IElementNodeVM;
    renderers: FieldRenderers;
}

const ElementNodeRenderer = observer(function ElementNodeRenderer({
    node,
    renderers
}: ElementNodeRendererProps) {
    const Renderer = renderers[`element:${node.renderer}`];

    if (!Renderer) {
        if (process.env.NODE_ENV === "development") {
            console.warn(
                `[FormView] No renderer found for element "${node.renderer}".`
            );
        }
        return null;
    }

    return <Renderer field={{ ...node.props } as any} />;
});
