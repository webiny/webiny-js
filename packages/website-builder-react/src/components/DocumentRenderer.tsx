import React from "react";
import { type Component, contentSdk, type Document } from "@webiny/website-builder-sdk";
import { ElementRenderer } from "./ElementRenderer.js";
import { DocumentStoreProvider } from "./DocumentStoreProvider.js";
import { ConnectToEditor } from "./ConnectToEditor.js";
import { editorComponents } from "../editorComponents/index.js";
import type { DocumentFragments } from "./FragmentsProvider.js";
import { FragmentsProvider } from "./FragmentsProvider.js";
import type { DocumentFragmentProps } from "~/components/DocumentFragment.js";

interface DocumentRendererProps {
    document: Document | null;
    components: Component[];
    children?: React.ReactNode | React.ReactNode[];
}

export const DocumentRenderer = ({ document, components, children }: DocumentRendererProps) => {
    const allComponents = [...editorComponents, ...components];
    allComponents.forEach(blueprint => contentSdk.registerComponent(blueprint));
    const fragments: DocumentFragments = [];

    React.Children.toArray(children)
        .filter(child => React.isValidElement(child))
        .forEach(child => {
            const props = child.props as DocumentFragmentProps;
            // Case 1:
            if (props.name && props.children) {
                fragments.push({
                    type: "fixed",
                    name: props.name,
                    element: <>{props.children}</>
                });
            }

            // Case 2:
            if (props.component) {
                fragments.push({
                    type: "component",
                    component: props.component,
                    inputs: props.inputs ?? {}
                });
            }
        });

    if (!document) {
        return <div data-role={"document-renderer"}>{children}</div>;
    }

    return (
        <div data-role={"document-renderer"}>
            <FragmentsProvider fragments={fragments ?? {}}>
                {contentSdk.isEditing() ? (
                    <ConnectToEditor document={document} components={components} />
                ) : (
                    <DocumentStoreProvider id={document.properties.id} document={document}>
                        <ElementRenderer id={"root"} />
                    </DocumentStoreProvider>
                )}
            </FragmentsProvider>
        </div>
    );
};
