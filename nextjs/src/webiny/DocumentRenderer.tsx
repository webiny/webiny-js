"use client";
import React from "react";
import dynamic from "next/dynamic";
import { customComponents } from "@/webiny/customComponents";
import { type Document } from "@webiny/website-builder-react";

// Dynamically import DocumentRenderer with SSR enabled for non-editing mode.
// This component will be server-side rendered for better SEO and initial load performance.
const DocumentRendererSSR = dynamic(
    // eslint-disable-next-line import/dynamic-import-chunkname
    () => import("@webiny/website-builder-react").then(m => ({ default: m.DocumentRenderer })),
    { ssr: true }
);

// Dynamically import DocumentRenderer with SSR disabled for editing mode.
// This prevents hydration mismatches and allows client-only behavior needed during editing.
const DocumentRendererNoSSR = dynamic(
    // eslint-disable-next-line import/dynamic-import-chunkname
    () => import("@webiny/website-builder-react").then(m => ({ default: m.DocumentRenderer })),
    { ssr: false }
);

interface DocumentRendererProps {
    document: Document | null;
    isEditing?: boolean;
}

// Main DocumentRenderer component that decides whether to render with SSR or without SSR
// based on the `isEditing` flag. If no document is provided, it shows a simple "Page Not Found" message.
export const DocumentRenderer = ({ document, isEditing }: DocumentRendererProps) => {
    if (!document) {
        // Render fallback UI when document data is missing
        return <h2>Page Not Found!</h2>;
    }

    // Render client-only version when editing to avoid SSR issues,
    // otherwise render server-side for production view.
    return isEditing ? (
        <DocumentRendererNoSSR document={document} components={customComponents} />
    ) : (
        <DocumentRendererSSR document={document} components={customComponents} />
    );
};
