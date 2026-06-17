import React, { createContext, useContext, useMemo } from "react";
import { observer } from "mobx-react-lite";
import { Grid, IconButton, Tabs, Tooltip, useToast } from "@webiny/admin-ui";
import { ReactComponent as CopyIcon } from "@webiny/icons/content_copy.svg";
import { ReactComponent as PasteIcon } from "@webiny/icons/content_paste.svg";
import { DevToolsSection } from "@webiny/react-properties";
import type {
    IFormVM,
    LayoutNodeVM,
    IRowNodeVM,
    IFieldVM,
    ITabsNodeVM,
    IElementNodeVM
} from "./abstractions.js";
import type { Icon } from "~/components/IconPicker/types.js";
import type { IconProp } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { DeveloperMode } from "~/components/DeveloperMode/DeveloperMode.js";
import { useFieldRenderers } from "~/features/formModel/useFieldRenderers.js";
import { useLayoutRenderers } from "~/features/formModel/useLayoutRenderers.js";

export function renderTabIcon(icon: Icon | undefined): React.ReactElement | undefined {
    if (!icon || typeof icon.name !== "string") {
        return undefined;
    }
    return <FontAwesomeIcon icon={icon.name.split("/") as IconProp} />;
}

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
    name: string;
    form: IFormVM;
    renderers?: FieldRenderers;
    layoutRenderers?: LayoutRenderers;
}

/**
 * Generic form view that walks layout nodes and renders fields.
 * This component is stateless — it reads from the FormVM and delegates to renderers.
 */
export const FormView = observer(({ name, form, renderers, layoutRenderers }: FormViewProps) => {
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
            <DevToolsSection name={name} group="Forms" data={form.getData()} views={"raw"} />
            <div className="w-full relative flex flex-col gap-4">
                <DevModeTools form={form} />
                {form.layout.map((node, index) => (
                    <LayoutNodeRenderer key={index} node={node} />
                ))}
            </div>
        </FormViewRenderersContext.Provider>
    );
});

export const LayoutNodeRenderer = observer(({ node }: { node: LayoutNodeVM }) => {
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

const RowNodeRenderer = observer(({ node }: { node: IRowNodeVM }) => {
    const { fieldRenderers } = useFormViewRenderers();

    return (
        <Grid>
            {node.fields.map(field => {
                const span = Math.floor(12 / node.fields.length) as React.ComponentProps<
                    typeof Grid.Column
                >["span"];

                return (
                    <Grid.Column key={field.name} span={span}>
                        <FieldRenderer field={field} renderers={fieldRenderers} />
                    </Grid.Column>
                );
            })}
        </Grid>
    );
});

interface FieldRendererProps {
    field: IFieldVM;
    renderers: FieldRenderers;
}

const FieldRenderer = observer(({ field, renderers }: FieldRendererProps) => {
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

const TabsNodeRenderer = observer(({ node }: TabsNodeRendererProps) => {
    const { layoutRenderers } = useFormViewRenderers();

    if (node.renderer) {
        const CustomRenderer = layoutRenderers[node.renderer];
        if (CustomRenderer) {
            return <CustomRenderer node={node} />;
        }
    }

    return (
        <Tabs
            value={node.activeTabId}
            onValueChange={id => node.setActiveTab(id)}
            tabs={node.tabs.map(tab => (
                <Tabs.Tab
                    key={tab.id}
                    value={tab.id}
                    icon={renderTabIcon(tab.icon)}
                    trigger={
                        <>
                            {tab.label}
                            {tab.hasErrors && (
                                <span className="ml-1 text-destructive-default text-xs">*</span>
                            )}
                        </>
                    }
                    disabled={tab.disabled}
                    content={
                        <div className={"flex flex-col gap-4 mt-md"}>
                            {tab.layout.map((childNode, index) => (
                                <LayoutNodeRenderer key={index} node={childNode} />
                            ))}
                        </div>
                    }
                />
            ))}
        />
    );
});

const ElementNodeRenderer = observer(({ node }: { node: IElementNodeVM }) => {
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

interface DevModelToolsProps {
    form: IFormVM;
}

const DevModeTools = ({ form }: DevModelToolsProps) => {
    const toast = useToast();

    const handleCopy = () => {
        const data = form.getData();
        navigator.clipboard.writeText(JSON.stringify(data, null, 2));
        toast.showSuccessToast({ title: "Form data copied to clipboard." });
    };

    const handlePaste = async () => {
        try {
            const text = await navigator.clipboard.readText();
            const data = JSON.parse(text);
            form.setData(data);
            toast.showSuccessToast({ title: "Form data imported from clipboard." });
        } catch {
            toast.showWarningToast({
                title: "Failed to import. Make sure clipboard contains valid JSON."
            });
        }
    };
    return (
        <DeveloperMode>
            <div className="absolute top-0 right-0 w-[200px] h-[80px] z-10 group/devtools">
                <div className="absolute top-0 right-0 flex gap-xs opacity-0 group-hover/devtools:opacity-100 transition-opacity">
                    <Tooltip
                        content="Copy form data to clipboard"
                        trigger={
                            <IconButton
                                variant={"secondary"}
                                icon={<CopyIcon />}
                                onClick={handleCopy}
                                size="sm"
                            />
                        }
                    />
                    <Tooltip
                        content="Paste form data from clipboard"
                        trigger={
                            <IconButton
                                variant={"secondary"}
                                icon={<PasteIcon />}
                                onClick={handlePaste}
                                size="sm"
                            />
                        }
                    />
                </div>
            </div>
        </DeveloperMode>
    );
};
