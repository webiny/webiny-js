import React, { useCallback, useState } from "react";
import { createReactiveComponent } from "@webiny/app-admin";
import { OverlayLayout } from "@webiny/app-admin/components/OverlayLayout/index.js";
import { Button, Text } from "@webiny/admin-ui";
import { useToast } from "@webiny/admin-ui";
import MonacoEditor from "@monaco-editor/react";
import type { IComponentEditorPresenter } from "../abstractions.js";

interface CodeOverlayProps {
    onClose: () => void;
    presenter: IComponentEditorPresenter;
}

const monacoOptions = {
    minimap: { enabled: false },
    fontSize: 13,
    scrollBeyondLastLine: false,
    wordWrap: "on" as const,
    tabSize: 4,
    readOnly: false,
    domReadOnly: false
};

const readOnlyMonacoOptions = {
    ...monacoOptions,
    readOnly: true,
    domReadOnly: true
};

type TabKey = "jsx" | "css" | "bundled" | "bundledCss";

const TAB_CONFIG: Array<{ key: TabKey; label: string; readOnly?: boolean }> = [
    { key: "jsx", label: "JSX source" },
    { key: "css", label: "CSS" },
    { key: "bundled", label: "Bundled JS", readOnly: true },
    { key: "bundledCss", label: "Bundled CSS", readOnly: true }
];

export const CodeOverlay = createReactiveComponent(function CodeOverlay({
    onClose,
    presenter
}: CodeOverlayProps) {
    const toast = useToast();
    const [activeTab, setActiveTab] = useState<TabKey>("jsx");

    const { vm } = presenter;
    const formData = vm.form.getData() as { name?: string };
    const componentName = formData.name || "Custom/Component";

    const handleSave = useCallback(async () => {
        await presenter.save();
        toast.showSuccessToast({ title: "Component saved." });
        onClose();
    }, [presenter, onClose]);

    const getEditorValue = () => {
        switch (activeTab) {
            case "jsx":
                return vm.source;
            case "css":
                return vm.css;
            case "bundled":
                return vm.component?.bundledJs || "// Not yet bundled.";
            case "bundledCss":
                return vm.component?.bundledCss || "/* Not yet bundled. */";
        }
    };

    const getEditorLanguage = () => {
        return activeTab === "css" || activeTab === "bundledCss" ? "css" : "javascript";
    };

    const handleEditorChange = useCallback(
        (value: string | undefined) => {
            if (value === undefined) {
                return;
            }
            if (activeTab === "jsx") {
                presenter.setSource(value);
            } else if (activeTab === "css") {
                presenter.setCss(value);
            }
        },
        [activeTab, presenter]
    );

    const barLeft = (
        <div className="flex items-center gap-md">
            <Text size="sm" className="text-neutral-light">
                {componentName}
            </Text>
        </div>
    );

    const barMiddle = (
        <div className="flex items-center gap-xs">
            {TAB_CONFIG.map(tab => (
                <Button
                    key={tab.key}
                    variant={activeTab === tab.key ? "secondary" : "ghost-negative"}
                    size="sm"
                    text={tab.readOnly ? `${tab.label}  read-only` : tab.label}
                    onClick={() => setActiveTab(tab.key)}
                />
            ))}
        </div>
    );

    const barRight = (
        <div className="flex items-center gap-sm">
            <Button
                variant="primary"
                size="sm"
                onClick={handleSave}
                disabled={vm.saving}
                text="Save"
            />
        </div>
    );

    return (
        <OverlayLayout
            variant="strong"
            onExited={onClose}
            barLeft={barLeft}
            barMiddle={barMiddle}
            barRight={barRight}
        >
            <MonacoEditor
                key={activeTab}
                language={getEditorLanguage()}
                value={getEditorValue()}
                onChange={handleEditorChange}
                height="100%"
                options={
                    activeTab === "bundled" || activeTab === "bundledCss"
                        ? readOnlyMonacoOptions
                        : monacoOptions
                }
            />
        </OverlayLayout>
    );
});
