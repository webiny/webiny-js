import React from "react";
import { draftMode } from "next/headers";
import { contentSdk } from "@webiny/website-builder-react";
import { initContentSdk } from "@/webiny/initContentSdk";
import { PageLayout } from "@/webiny/PageLayout";
import { DocumentRenderer } from "@/webiny/DocumentRenderer";

// This function runs at build time to generate all static paths for Next.js prerendering.
// We must initialize the SDK here because the SDK needs to be ready before fetching the list of pages.
export async function generateStaticParams() {
    initContentSdk();
    const pages = await contentSdk.listPages();

    return pages.map(page => ({ slug: page.properties.path }));
}

// This function fetches page data for a given path, considering preview (draft) mode.
// It is critical to initialize the SDK **before** using the `contentSdk` because this function
// runs **before** any React components mount, so our ContentSdkInitializer has no effect.
async function getPage(path: string) {
    const { isEnabled } = await draftMode();

    // Initialize the SDK with the preview flag to ensure correct data fetching.
    initContentSdk({ preview: isEnabled });

    return await contentSdk.getPage(path);
}

// The main page component, rendered server-side, receives parameters and search params.
// It takes into account the live editing mode (`wb.editing` query parameter).
export default async function ProductPage({
    params,
    searchParams
}: {
    params: Promise<{ slug: string }>;
    searchParams: Promise<Record<string, string>>;
}) {
    const { slug } = await params;
    const search = await searchParams;

    const isEditing = search["wb.editing"] === "true";
    const page = await getPage(`/${slug}`);

    return (
        <PageLayout>
            <DocumentRenderer document={page} isEditing={isEditing} />
        </PageLayout>
    );
}
