import React, { createContext, useContext, useMemo } from "react";
import { observer } from "mobx-react-lite";
import type {
    IFormVM,
    LayoutNodeVM,
    IRowNodeVM,
    IFieldVM,
    ITabsNodeVM,
    IElementNodeVM
} from "./abstractions.js";
import { useFieldRenderers } from "~/features/formModel/useFieldRenderers.js";
import { useLayoutRenderers } from "~/features/formModel/useLayoutRenderers.js";

/**
 * A field renderer component receives a FieldVM and renders the appropriate UI.
 */
export type FieldRendererComponent = React.ComponentType<{ field: IFieldVM }>;

/**
 * Map of renderer keys to React components for fields.
 * Lookup order: `{type}:{renderer}` → `{type}`.
 */
export type FieldRenderers = Record<string, FieldRendererComponent>;

/**
 * Map of renderer keys to React components for layout nodes.
 */
export type LayoutRenderers = Record<string, React.ComponentType<any>>;

interface FormViewRenderers {
    fieldRenderers: FieldRenderers;
    layoutRenderers: LayoutRenderers;
}

const FormViewRenderersContext = createContext<FormViewRenderers | null>(null);

const useFormViewRenderers = (): FormViewRenderers => {
    const ctx = useContext(FormViewRenderersContext);
    if (!ctx) {
        throw new Error("useFormViewRenderers must be used within a FormView.");
    }
    return ctx;
};

export { useFormViewRenderers };

interface FormViewProps {
    form: IFormVM;
    renderers?: FieldRenderers;
    layoutRenderers?: LayoutRenderers;
}

/**
 * Generic form view that walks layout nodes and renders fields.
 * This component is stateless — it reads from the FormVM and delegates to renderers.
 */
export const FormView = observer(function FormView({
    form,
    renderers,
    layoutRenderers
}: FormViewProps) {
    const defaultFieldRenderers = useFieldRenderers();
    const defaultLayoutRenderers = useLayoutRenderers();

    const value = useMemo(
        () => ({
            fieldRenderers: renderers ?? defaultFieldRenderers,
            layoutRenderers: layoutRenderers ?? defaultLayoutRenderers
        }),
        [renderers, defaultFieldRenderers, layoutRenderers, defaultLayoutRenderers]
    );

    return (
        <FormViewRenderersContext.Provider value={value}>
            <div className="w-full flex flex-col gap-4">
                {form.layout.map((node, index) => (
                    <LayoutNodeRenderer key={index} node={node} />
                ))}
            </div>
        </FormViewRenderersContext.Provider>
    );
});

export const LayoutNodeRenderer = observer(function LayoutNodeRenderer({
    node
}: {
    node: LayoutNodeVM;
}) {
    switch (node.type) {
        case "row":
            return <RowNodeRenderer node={node} />;
        case "separator":
            return <SeparatorNodeRenderer />;
        case "tabs":
            return <TabsNodeRenderer node={node} />;
        case "element":
            return <ElementNodeRenderer node={node} />;
        default:
            return null;
    }
});

const RowNodeRenderer = observer(function RowNodeRenderer({ node }: { node: IRowNodeVM }) {
    const { fieldRenderers } = useFormViewRenderers();

    return (
        <div className="grid grid-cols-12 gap-4">
            {node.fields.map(field => {
                const span = Math.floor(12 / node.fields.length);
                return (
                    <div key={field.name} className={`col-span-${span}`}>
                        <FieldRenderer field={field} renderers={fieldRenderers} />
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

export interface TabsNodeRendererProps {
    node: ITabsNodeVM;
}

const TabsNodeRenderer = observer(function TabsNodeRenderer({ node }: TabsNodeRendererProps) {
    const { layoutRenderers } = useFormViewRenderers();

    if (node.renderer) {
        const CustomRenderer = layoutRenderers[node.renderer];
        if (CustomRenderer) {
            return <CustomRenderer node={node} />;
        }
    }

    const activeTab = node.tabs.find(t => t.id === node.activeTabId);

    return (
        <div>
            <div className="flex border-b border-neutral-dimmed">
                {node.tabs.map(tab => (
                    <button
                        key={tab.id}
                        type="button"
                        disabled={tab.disabled}
                        className={`px-4 py-2 text-sm font-medium border-b-2 ${
                            tab.id === node.activeTabId
                                ? "border-primary text-primary"
                                : "border-transparent text-neutral hover:text-neutral-strong"
                        } ${tab.disabled ? "opacity-50 cursor-not-allowed" : ""}`}
                        onClick={() => node.setActiveTab(tab.id)}
                    >
                        {tab.label}
                        {tab.hasErrors && <span className="ml-1 text-destructive text-xs">*</span>}
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
                            <LayoutNodeRenderer key={index} node={childNode} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
});

const ElementNodeRenderer = observer(function ElementNodeRenderer({
    node
}: {
    node: IElementNodeVM;
}) {
    const { fieldRenderers } = useFormViewRenderers();
    const Renderer = fieldRenderers[`element:${node.renderer}`];

    if (!Renderer) {
        if (process.env.NODE_ENV === "development") {
            console.warn(`[FormView] No renderer found for element "${node.renderer}".`);
        }
        return null;
    }

    return <Renderer field={{ ...node.props } as any} />;
});
