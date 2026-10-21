import React from "react";
import {
    type Component,
    contentSdk,
    type Document,
    withGlobalElementDefaults
} from "@webiny/website-builder-sdk";
import { DocumentStoreProvider } from "./DocumentStoreProvider.js";
import { ConnectToEditor } from "./ConnectToEditor.js";
import { editorComponents } from "../editorComponents/index.js";
import type { DocumentFragments } from "./FragmentsProvider.js";
import { FragmentsProvider } from "./FragmentsProvider.js";
import type { DocumentFragmentProps } from "~/components/DocumentFragment.js";
import type { DocumentLayout } from "./renderWithLayout.js";
import { PageWithLayout } from "./PageLayout.js";

/**
 * The page is delivered with its stored global components. A global that was never saved is rendered
 * from its manifest defaults, so a global defined in code shows up right away.
 */
const withGlobalComponentDefaults = (document: Document): Document => {
    const withDefaults = withGlobalElementDefaults(document, contentSdk.getComponentManifests());
    if (withDefaults === document) {
        return document;
    }

    return { ...document, elements: withDefaults.elements, bindings: withDefaults.bindings };
};

export interface DocumentRendererProps {
    // In the editor's preview, `null` renders the document open in the editor (e.g., a layout).
    document: Document | null;
    components: Component[];
    /**
     * Place the page `content` and global components (via <GlobalComponent>) around it.
     * A page with a layout picked in its settings is rendered in that layout instead.
     */
    layout?: DocumentLayout;
    children?: React.ReactNode | React.ReactNode[];
}

export const DocumentRenderer = ({
    document,
    components,
    layout,
    children
}: DocumentRendererProps) => {
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

    if (!document && !contentSdk.isEditing()) {
        return <div data-role={"document-renderer"}>{children}</div>;
    }

    return (
        <div data-role={"document-renderer"}>
            <FragmentsProvider fragments={fragments ?? {}}>
                {contentSdk.isEditing() ? (
                    <ConnectToEditor document={document} components={components} layout={layout} />
                ) : (
                    <DocumentStoreProvider
                        id={document!.properties.id}
                        document={withGlobalComponentDefaults(document!)}
                    >
                        <PageWithLayout layout={layout} />
                    </DocumentStoreProvider>
                )}
            </FragmentsProvider>
        </div>
    );
};
