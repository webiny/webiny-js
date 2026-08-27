import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DiContainerProvider, useContainer, useRoute } from "@webiny/app";
import { useRouter, FormView, FormErrors, createReactiveComponent } from "@webiny/app-admin";
import { createFieldRenderer } from "@webiny/app-admin/features/formModel/createFieldRenderer.js";
import {
    Button,
    DelayedOnChange,
    Heading,
    IconButton,
    Input,
    OverlayLoader,
    ScrollArea,
    SegmentedControl,
    Separator,
    Tag,
    Text,
    Textarea,
    TimeAgo
} from "@webiny/admin-ui";
import { useToast } from "@webiny/admin-ui";
import { useDocumentEditor } from "@webiny/app-website-builder/DocumentEditor/DocumentEditor.js";
import MonacoEditor from "@monaco-editor/react";
import { ReactComponent as ArrowBackIcon } from "@webiny/icons/arrow_back.svg";
import { ReactComponent as CodeIcon } from "@webiny/icons/code.svg";
import { ReactComponent as ExpandIcon } from "@webiny/icons/keyboard_arrow_up.svg";
import { ReactComponent as CollapseIcon } from "@webiny/icons/keyboard_arrow_down.svg";
import { ReactComponent as RefreshIcon } from "@webiny/icons/refresh.svg";
import { ComponentEditorFeature } from "../feature.js";
import { BreakpointSelector } from "@webiny/app-website-builder/BaseEditor/defaultConfig/Content/AddressBar/BreakpointSelector.js";
import {
    SandboxEditorProvider,
    SANDBOX_ELEMENT_ID,
    buildDocumentFromManifest
} from "./SandboxEditor.js";
import { SandboxInputPanel } from "./SandboxInputPanel.js";
import { SandboxIframe } from "./SandboxIframe.js";
import { CodeOverlay } from "./CodeOverlay.js";
import { RefinePanel } from "./RefinePanel.js";
import { RemoteComponentGatewayFeature } from "~/admin/features/shared/feature.js";
import { useComponentEditorPresenter } from "../useComponentEditorPresenter.js";
import { Routes } from "~/admin/routes.js";
import type { IComponentEditorPresenter } from "../abstractions.js";

const monacoOptions = {
    minimap: { enabled: false },
    fontSize: 13,
    scrollBeyondLastLine: false,
    wordWrap: "on" as const,
    tabSize: 4,
    readOnly: false,
    domReadOnly: false
};

const SetDefaultsButton = createReactiveComponent(function SetDefaultsButton({
    presenter
}: {
    presenter: IComponentEditorPresenter;
}) {
    const editor = useDocumentEditor();
    const toast = useToast();

    const handleSetDefaults = useCallback(() => {
        const docState = editor.getDocumentState().read();
        const bindings = docState.bindings[SANDBOX_ELEMENT_ID]?.inputs;
        if (bindings) {
            presenter.setDefaultInputs(bindings);
            toast.showSuccessToast({ title: "Defaults updated in source." });
        }
    }, [editor, presenter]);

    const handleReset = useCallback(() => {
        presenter.resetInputs();

        const sandbox = presenter.vm.sandbox;
        if (sandbox) {
            const freshDoc = buildDocumentFromManifest(sandbox.manifest);
            editor.updateDocument((state: any) => {
                state.bindings = freshDoc.bindings as any;
                state.elements = freshDoc.elements as any;
            });
        }

        toast.showSuccessToast({ title: "Inputs reset to defaults." });
    }, [presenter, editor]);

    const sandbox = presenter.vm.sandbox;
    const componentName = sandbox ? sandbox.componentName : "Custom/Component";

    return (
        <SandboxInputPanel
            componentName={componentName}
            onSetDefaults={handleSetDefaults}
            onReset={handleReset}
        />
    );
});

const BACKGROUNDS = [
    {
        value: "light",
        className: "bg-white",
        swatchClass: "bg-white border border-neutral-dimmed"
    },
    {
        value: "dark",
        className: "bg-black",
        swatchClass: "bg-black"
    },
    {
        value: "checker",
        className: "fill-checker",
        swatchClass: "fill-checker border border-neutral-dimmed"
    },
    {
        value: "dots",
        className: "fill-grid",
        swatchClass: "fill-grid border border-neutral-dimmed"
    }
];

function SandboxPreview() {
    const [reloadKey, setReloadKey] = useState(0);
    const [background, setBackground] = useState("dots");

    const handleReload = useCallback(() => {
        setReloadKey(k => k + 1);
    }, []);

    const bgEntry = BACKGROUNDS.find(b => b.value === background);
    const bgClass = bgEntry ? bgEntry.className : "bg-white";

    return (
        <div className="flex flex-col flex-1 min-w-0">
            <div className="flex items-center gap-sm py-xs px-md border-b border-neutral-dimmed flex-shrink-0">
                <BreakpointSelector />
                <div className="flex items-center gap-xs">
                    {BACKGROUNDS.map(bg => (
                        <button
                            key={bg.value}
                            type="button"
                            onClick={() => setBackground(bg.value)}
                            className={`size-md rounded-xs cursor-pointer ${bg.swatchClass} ${background === bg.value ? "ring-2 ring-primary-default ring-offset-1" : ""}`}
                            aria-label={`${bg.value} background`}
                        />
                    ))}
                </div>
                <div className="flex-1" />
                <IconButton
                    icon={<RefreshIcon />}
                    variant="ghost"
                    size="sm"
                    onClick={handleReload}
                    aria-label="Reload preview"
                />
            </div>
            <div className="flex-1 min-h-0">
                <SandboxIframe reloadKey={reloadKey} backgroundClass={bgClass} />
            </div>
        </div>
    );
}

const CompactInputRenderer = createFieldRenderer(({ field }) => {
    return (
        <DelayedOnChange value={field.value} onChange={value => field.onChange(value)}>
            <Input
                size="md"
                variant="secondary"
                label={field.label}
                hint={field.help}
                placeholder={field.placeholder}
                description={field.description}
                note={field.note}
                required={field.required}
                disabled={field.disabled}
                validation={field.validation}
                onBlur={() => field.onBlur()}
            />
        </DelayedOnChange>
    );
});

const CompactTextareaRenderer = createFieldRenderer(({ field }) => {
    return (
        <DelayedOnChange value={field.value} onChange={value => field.onChange(value)}>
            <Textarea
                size="md"
                variant="secondary"
                label={field.label}
                hint={field.help}
                placeholder={field.placeholder}
                description={field.description}
                note={field.note}
                required={field.required}
                disabled={field.disabled}
                validation={field.validation}
                onBlur={() => field.onBlur()}
                rows={(field.rendererSettings?.rows as number) ?? 3}
            />
        </DelayedOnChange>
    );
});

const compactRenderers = {
    textInput: CompactInputRenderer,
    textarea: CompactTextareaRenderer
};

function SidebarTabs({ presenter }: { presenter: IComponentEditorPresenter }) {
    const [tab, setTab] = useState("inputs");
    const { vm } = presenter;

    return (
        <div className="flex flex-col h-full">
            <div className="px-sm pt-sm pb-sm">
                <SegmentedControl
                    items={[
                        { label: "Inputs", value: "inputs" },
                        { label: "Refine", value: "refine" },
                        { label: "Component", value: "component" }
                    ]}
                    value={tab}
                    onChange={(val: string) => setTab(val)}
                    fullWidth
                />
            </div>
            {tab === "inputs" ? (
                <SetDefaultsButton presenter={presenter} />
            ) : (
                <ScrollArea className="flex-1 min-h-0">
                    {tab === "refine" ? (
                        <RefinePanel presenter={presenter} />
                    ) : (
                        <div className="p-md">
                            <FormErrors form={vm.form} className="mb-sm" />
                            <FormView
                                name="RemoteComponent"
                                form={vm.form}
                                renderers={compactRenderers}
                            />
                        </div>
                    )}
                </ScrollArea>
            )}
        </div>
    );
}

const ComponentEditorInner = createReactiveComponent(function ComponentEditorInner() {
    const presenter = useComponentEditorPresenter();
    const { goToRoute } = useRouter();
    const { route } = useRoute(Routes.Editor);
    const toast = useToast();

    const [codeOverlayOpen, setCodeOverlayOpen] = useState(false);
    const [cssExpanded, setCssExpanded] = useState(false);
    const [cssPanelHeight, setCssPanelHeight] = useState(200);
    const [cssResizing, setCssResizing] = useState(false);
    const cssResizeRef = useRef<{ startY: number; startHeight: number } | null>(null);

    useEffect(() => {
        const id = route ? route.params.id : undefined;
        if (id) {
            presenter.init(id);
        }
    }, [presenter]);

    const handleSave = useCallback(async () => {
        await presenter.save();
        toast.showSuccessToast({ title: "Component saved." });
    }, [presenter]);

    const handleCssResizeStart = useCallback(
        (e: React.MouseEvent) => {
            e.preventDefault();
            cssResizeRef.current = { startY: e.clientY, startHeight: cssPanelHeight };
            setCssResizing(true);

            const onMouseMove = (e: MouseEvent) => {
                if (!cssResizeRef.current) {
                    return;
                }
                const delta = cssResizeRef.current.startY - e.clientY;
                const newHeight = Math.max(
                    80,
                    Math.min(600, cssResizeRef.current.startHeight + delta)
                );
                setCssPanelHeight(newHeight);
            };

            const onMouseUp = () => {
                cssResizeRef.current = null;
                setCssResizing(false);
                document.removeEventListener("mousemove", onMouseMove);
                document.removeEventListener("mouseup", onMouseUp);
            };

            document.addEventListener("mousemove", onMouseMove);
            document.addEventListener("mouseup", onMouseUp);
        },
        [cssPanelHeight]
    );

    const { vm } = presenter;

    const formData = vm.form.getData() as { name?: string; label?: string };
    const componentLabel = formData.label || "Component";
    const componentName = formData.name || "Custom/Component";

    return (
        <>
            {vm.loading ? <OverlayLoader text="Loading..." /> : null}
            {vm.saving ? <OverlayLoader text="Saving..." /> : null}
            {vm.bundling ? <OverlayLoader text="Bundling..." /> : null}

            <div className="flex flex-col h-main-content">
                {/* Header bar */}
                <div className="flex items-center gap-sm py-xs px-md">
                    <IconButton
                        icon={<ArrowBackIcon />}
                        variant="ghost"
                        size="sm"
                        onClick={() => goToRoute(Routes.List)}
                        aria-label="Back to list"
                    />
                    <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-xs">
                            <Heading level={6}>{componentLabel}</Heading>
                            <Tag variant="neutral-muted" content="Draft" />
                            {vm.refining ? <Tag variant="warning" content="Generating" /> : null}
                        </div>
                        <Text size="sm" className="text-neutral-strong truncate text-sm">
                            {componentName}
                        </Text>
                    </div>
                    <div className="flex-1" />
                    {vm.component?.savedOn ? (
                        <Text size="sm" className="text-neutral-strong whitespace-nowrap">
                            Saved <TimeAgo datetime={vm.component.savedOn} />
                        </Text>
                    ) : null}
                    <Button
                        variant="secondary"
                        icon={<CodeIcon />}
                        text="Code"
                        onClick={() => setCodeOverlayOpen(true)}
                    />
                    <Button
                        variant="primary"
                        onClick={handleSave}
                        disabled={vm.saving || vm.bundling}
                        text={vm.bundling ? "Bundling..." : "Save"}
                    />
                </div>
                <Separator />

                {/* Main content */}
                {vm.sandbox ? (
                    <SandboxEditorProvider sandbox={vm.sandbox}>
                        <div className="flex flex-1 min-h-0">
                            <div
                                className={`flex flex-col flex-1 min-w-0 ${cssResizing ? "[&_iframe]:pointer-events-none" : ""}`}
                            >
                                <SandboxPreview />
                                <div className="flex-shrink-0">
                                    {cssExpanded ? (
                                        <div
                                            className="h-[4px] cursor-row-resize border-t border-neutral-dimmed hover:bg-primary-dimmed active:bg-primary-default transition-colors"
                                            onMouseDown={handleCssResizeStart}
                                        />
                                    ) : null}
                                    <div
                                        className="flex items-center justify-between px-md py-xs cursor-pointer border-t border-neutral-dimmed"
                                        onClick={() => setCssExpanded(prev => !prev)}
                                    >
                                        <div className="flex items-center gap-sm">
                                            <Text size="sm" className="font-medium">
                                                Styles
                                            </Text>
                                            <Text size="sm" className="text-neutral-strong">
                                                component.css
                                            </Text>
                                            <Tag variant="success" content="Live" />
                                        </div>
                                        <IconButton
                                            icon={cssExpanded ? <CollapseIcon /> : <ExpandIcon />}
                                            variant="ghost"
                                            size="xs"
                                            aria-label={cssExpanded ? "Collapse CSS" : "Expand CSS"}
                                        />
                                    </div>
                                    {cssExpanded ? (
                                        <div style={{ height: cssPanelHeight }}>
                                            <MonacoEditor
                                                language="css"
                                                value={vm.css}
                                                onChange={(value: string | undefined) => {
                                                    if (value !== undefined) {
                                                        presenter.setCss(value);
                                                    }
                                                }}
                                                height="100%"
                                                options={monacoOptions}
                                            />
                                        </div>
                                    ) : null}
                                </div>
                            </div>
                            <div
                                className="w-[320px] flex-shrink-0 border-l border-neutral-dimmed flex flex-col overflow-y-auto p-sm relative"
                                data-role="wb-object-panel-anchor"
                            >
                                <SidebarTabs presenter={presenter} />
                            </div>
                        </div>
                    </SandboxEditorProvider>
                ) : (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="text-center">
                            <Text className="text-neutral-strong">
                                No bundled output yet. Open the code editor to edit source, then
                                bundle.
                            </Text>
                            <div className="mt-md">
                                <Button
                                    variant="secondary"
                                    icon={<CodeIcon />}
                                    text="Open Code Editor"
                                    onClick={() => setCodeOverlayOpen(true)}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Error bar */}
                {vm.error ? (
                    <div className="px-md py-sm border-t border-destructive-dimmed bg-destructive-subtle">
                        <Text size="sm" className="text-destructive-default">
                            {vm.error}
                        </Text>
                    </div>
                ) : null}
            </div>

            {/* Code overlay */}
            {codeOverlayOpen ? (
                <CodeOverlay onClose={() => setCodeOverlayOpen(false)} presenter={presenter} />
            ) : null}
        </>
    );
});

export const ComponentEditorPage = () => {
    const container = useContainer();

    const scopedContainer = useMemo(() => {
        const child = container.createChildContainer();
        RemoteComponentGatewayFeature.register(child);
        ComponentEditorFeature.register(child);
        return child;
    }, []);

    return (
        <DiContainerProvider container={scopedContainer}>
            <ComponentEditorInner />
        </DiContainerProvider>
    );
};
