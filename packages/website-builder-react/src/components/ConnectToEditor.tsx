"use client";
import React, { useEffect, useState } from "react";
import { type Component, type Document } from "@webiny/website-builder-sdk";
import { DocumentStoreProvider } from "~/components/DocumentStoreProvider.js";
import { ElementRenderer } from "~/components/ElementRenderer.js";
import { useContentClient } from "~/components/useContentClient.js";

interface ConnectToEditorProps {
    document: Document;
    components: Component[];
}

export const ConnectToEditor = (props: ConnectToEditorProps) => {
    const client = useContentClient();
    const [data, setData] = useState<Document | null>(null);

    useEffect(() => {
        client.getPage(props.document.properties.path).then(document => {
            setData(document);
        });
    }, []);

    if (!data) {
        return null;
    }

    return (
        <DocumentStoreProvider id={data.properties.id} document={data}>
            <ElementRenderer id={"root"} />
        </DocumentStoreProvider>
    );
};
