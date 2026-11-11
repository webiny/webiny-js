// @vitest-environment jsdom
import React from "react";
import { act, cleanup, render, screen } from "@testing-library/react";
import { describe, it, expect, afterEach, vi } from "vitest";
import { createContentClient, type Document } from "@webiny/website-builder-sdk";
import { ContentClientProvider } from "./ContentClientProvider.js";
import { DocumentStoreProvider } from "./DocumentStoreProvider.js";
import { useDocumentState } from "./useDocumentState.js";

const createDocument = (title: string): Document => {
    return {
        id: "page-1",
        version: 1,
        state: { title },
        properties: { id: "page-1", path: "/" },
        extensions: {},
        metadata: {} as Document["metadata"],
        bindings: {},
        elements: {}
    };
};

const Title = () => {
    const state = useDocumentState();
    return <span>{String(state.title)}</span>;
};

describe("DocumentStoreProvider", () => {
    const client = createContentClient({
        apiHost: "https://a.example.com",
        apiKey: "key-a",
        apiTenant: "tenant-a"
    });

    const page = (document: Document) => (
        <ContentClientProvider client={client}>
            <DocumentStoreProvider id={"page-1"} document={document}>
                <Title />
            </DocumentStoreProvider>
        </ContentClientProvider>
    );

    afterEach(() => {
        cleanup();
        vi.restoreAllMocks();
    });

    // Regression: the document went into the store during render, so the subscribed children were
    // updated while the provider rendered (React: "Cannot update a component while rendering a
    // different component").
    it("shows a new document without updating its children during render", async () => {
        const consoleError = vi.spyOn(console, "error");
        const { rerender } = render(page(createDocument("First")));
        expect(screen.getByText("First")).toBeTruthy();

        await act(async () => {
            rerender(page(createDocument("Second")));
        });

        expect(screen.getByText("Second")).toBeTruthy();
        expect(consoleError).not.toHaveBeenCalled();
    });

    it("doesn't touch the store when it renders again with the same document", async () => {
        const document = createDocument("Same");
        const { rerender } = render(page(document));
        const store = client.getDocumentStoreManager().getStore("page-1");
        const setDocument = vi.spyOn(store, "setDocument");

        await act(async () => {
            rerender(page(document));
        });

        expect(setDocument).not.toHaveBeenCalled();
        expect(screen.getByText("Same")).toBeTruthy();
    });
});
