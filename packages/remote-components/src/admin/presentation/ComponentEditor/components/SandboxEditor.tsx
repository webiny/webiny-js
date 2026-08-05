import React, { useEffect, useRef, useState } from "react";
import { useFeature } from "@webiny/app";
import { DocumentEditor } from "@webiny/app-website-builder/DocumentEditor/DocumentEditor.js";
import { useDocumentEditor } from "@webiny/app-website-builder/DocumentEditor/DocumentEditor.js";
import {
    EditorConfig,
    EditorWithConfig
} from "@webiny/app-website-builder/BaseEditor/config/EditorConfig.js";
import { CommandHandlers } from "@webiny/app-website-builder/BaseEditor/commandHandlers/index.js";
import { Commands } from "@webiny/app-website-builder/BaseEditor/index.js";
import { ElementInputRenderers } from "@webiny/app-website-builder/BaseEditor/defaultConfig/ElementInputRenderers.js";
import { Layout } from "@webiny/app-website-builder/BaseEditor/config/Layout.js";
import { ThemeProvider } from "@webiny/app-website-builder/BaseEditor/components/ThemeProvider.js";
import { Editor } from "@webiny/app-website-builder/editorSdk/Editor.js";
import { ElementFactory } from "@webiny/website-builder-sdk";
import type { WebsiteBuilderTheme, Document } from "@webiny/website-builder-sdk";
import { ComponentEditorFeature } from "../feature.js";
import type { ISandboxVm } from "../abstractions.js";

export const SANDBOX_ELEMENT_ID = "sandbox-element";

const OverrideLayout = Layout.createDecorator(() => {
    return function ComponentLayout() {
        return null;
    };
});

const SandboxConfig = React.memo(function SandboxConfig() {
    return (
        <>
            <CommandHandlers />
            <EditorConfig>
                <ElementInputRenderers />
            </EditorConfig>
            <OverrideLayout />
        </>
    );
});

function ThemeBridge({ children }: { children: React.ReactNode }) {
    const editor = useDocumentEditor();
    const [theme, setTheme] = useState<WebsiteBuilderTheme | undefined>(undefined);

    useEffect(() => {
        return editor.registerCommandHandler(Commands.SetTheme, ({ theme }) => {
            setTheme(theme);
        });
    }, [editor]);

    return (
        <ThemeProvider theme={theme}>
            <EditorWithConfig>{children}</EditorWithConfig>
        </ThemeProvider>
    );
}

function EditorSetup({ manifest }: { manifest: ISandboxVm["manifest"] }) {
    const editor = useDocumentEditor();
    const { editorProvider } = useFeature(ComponentEditorFeature);

    useEffect(() => {
        editor.updateEditor(state => {
            state.selectedElement = SANDBOX_ELEMENT_ID;
            if (!state.components) {
                state.components = {};
            }
            state.components[manifest.name] = {
                name: manifest.name,
                inputs: manifest.inputs,
                tags: []
            };
        });
        editorProvider.setEditor(editor);
    }, []);

    return null;
}

export function buildDocumentFromManifest(manifest: ISandboxVm["manifest"]): Document {
    const doc: Document = {
        id: "sandbox-doc",
        version: 1,
        state: {},
        properties: {
            id: "sandbox-doc",
            path: "/component-sandbox",
            title: "Component Sandbox"
        },
        extensions: {},
        metadata: {},
        bindings: {},
        elements: {
            root: {
                type: "Webiny/Element",
                id: "root",
                component: { name: "Webiny/Root" }
            }
        }
    };

    const factory = new ElementFactory({
        [manifest.name]: {
            name: manifest.name,
            inputs: manifest.inputs,
            defaults: manifest.defaults,
            applyDefaultStyles: manifest.applyDefaultStyles,
            tags: []
        }
    });

    const { element, operations } = factory.createElementFromComponent({
        componentName: manifest.name,
        parentId: "root",
        slot: "children"
    });

    const generatedId = element.id;
    element.id = SANDBOX_ELEMENT_ID;

    for (const op of operations) {
        op.apply(doc);
    }

    // Remap the generated ID to SANDBOX_ELEMENT_ID in elements and bindings.
    if (generatedId !== SANDBOX_ELEMENT_ID && doc.elements[generatedId]) {
        doc.elements[SANDBOX_ELEMENT_ID] = doc.elements[generatedId];
        doc.elements[SANDBOX_ELEMENT_ID].id = SANDBOX_ELEMENT_ID;
        delete doc.elements[generatedId];
    }
    if (generatedId !== SANDBOX_ELEMENT_ID && doc.bindings[generatedId]) {
        doc.bindings[SANDBOX_ELEMENT_ID] = doc.bindings[generatedId];
        delete doc.bindings[generatedId];
    }

    // Fix parent slot references (root's children binding).
    const rootInputs = doc.bindings.root?.inputs;
    if (rootInputs) {
        const childrenBinding = rootInputs.children;
        if (childrenBinding && childrenBinding.static === generatedId) {
            childrenBinding.static = SANDBOX_ELEMENT_ID;
        }
        if (childrenBinding && Array.isArray(childrenBinding.static)) {
            const idx = childrenBinding.static.indexOf(generatedId);
            if (idx >= 0) {
                childrenBinding.static[idx] = SANDBOX_ELEMENT_ID;
            }
        }
    }

    return doc;
}

interface SandboxEditorProviderProps {
    sandbox: ISandboxVm;
    children?: React.ReactNode;
}

export const SandboxEditorProvider = ({ sandbox, children }: SandboxEditorProviderProps) => {
    const editorRef = useRef<Editor<any> | null>(null);

    if (!editorRef.current) {
        const doc = buildDocumentFromManifest(sandbox.manifest);
        editorRef.current = new Editor(doc as any, { isReadOnly: false });
    }

    const editor = editorRef.current;
    const prevInputsRef = useRef(sandbox.manifest.inputs);

    useEffect(() => {
        if (prevInputsRef.current === sandbox.manifest.inputs) {
            return;
        }
        prevInputsRef.current = sandbox.manifest.inputs;

        const doc = buildDocumentFromManifest(sandbox.manifest);
        editor.updateDocument(state => {
            state.bindings = doc.bindings as any;
            state.elements = doc.elements as any;
        });
        editor.updateEditor(state => {
            if (!state.components) {
                state.components = {};
            }
            state.components[sandbox.componentName] = {
                ...state.components[sandbox.componentName],
                inputs: sandbox.manifest.inputs
            };
        });
    }, [sandbox.componentName, sandbox.manifest.inputs]);

    return (
        <DocumentEditor editor={editor} name="ComponentEditor">
            <SandboxConfig />
            <EditorSetup manifest={sandbox.manifest} />
            <ThemeBridge>{children}</ThemeBridge>
        </DocumentEditor>
    );
};
