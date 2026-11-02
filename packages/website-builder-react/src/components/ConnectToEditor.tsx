"use client";
import React, { useEffect, useState } from "react";
import { type Component, type Document } from "@webiny/website-builder-sdk";
import { DocumentStoreProvider } from "~/components/DocumentStoreProvider.js";
import type { DocumentLayout } from "~/components/renderWithLayout.js";
import { PageWithLayout } from "~/components/PageLayout.js";
import { useContentClient } from "~/components/useContentClient.js";

interface ConnectToEditorProps {
    // Without a document, render the document open in the editor, whatever its type (e.g., a layout).
    document: Document | null;
    components: Component[];
    layout?: DocumentLayout;
}

export const ConnectToEditor = (props: ConnectToEditorProps) => {
    const client = useContentClient();
    const [data, setData] = useState<Document | null>(null);

    useEffect(() => {
        const load = props.document
            ? client.getPage(props.document.properties.path)
            : (client.getEditingSdk()?.getEditedDocument() ?? Promise.resolve(null));

        load.then(document => {
            setData(document);
        });
    }, []);

    if (!data) {
        return null;
    }

    return (
        <DocumentStoreProvider id={data.properties.id} document={data}>
            <PageWithLayout layout={props.layout} />
        </DocumentStoreProvider>
    );
};
