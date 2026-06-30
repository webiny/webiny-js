import React, { useEffect } from "react";
import debounce from "lodash/debounce.js";
import { useRoute } from "@webiny/app-admin";
import type { EditorDocument } from "@webiny/website-builder-sdk";
import { useDocumentEditor } from "~/DocumentEditor/index.js";
import { useExperiments } from "~/presentation/experiments/useExperiments.js";
import { Routes } from "~/routes.js";

const VariantAutoSaveAction = () => {
    const editor = useDocumentEditor();
    const gateway = useExperiments();
    const { route } = useRoute(Routes.Experiments.VariantEditor);

    const saveVariant = debounce((state: EditorDocument) => {
        return gateway.updateVariant(route.params.id, {
            properties: state.properties,
            metadata: state.metadata,
            bindings: state.bindings,
            elements: state.elements,
            extensions: state.extensions
        });
    }, 500);

    useEffect(() => {
        return editor.onDocumentStateChange(async event => {
            const isReadOnly = editor.getEditorState().read().isReadOnly;
            if (isReadOnly) {
                return;
            }

            editor.updateEditor(state => {
                state.autoSaving = true;
            });

            await saveVariant(event.state);

            setTimeout(() => {
                editor.updateEditor(state => {
                    state.autoSaving = false;
                });
            }, 500);
        });
    }, []);

    return null;
};

export const VariantAutoSave = () => {
    return <VariantAutoSaveAction />;
};
