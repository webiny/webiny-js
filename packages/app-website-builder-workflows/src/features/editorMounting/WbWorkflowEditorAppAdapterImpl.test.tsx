import React from "react";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { Container } from "@webiny/di";
import { createFakeContentAdapter } from "@webiny/app-workflows/editor/testing/fakeEditorAppAdapter.js";
import { WbReviewContentAdapter } from "~/features/gateway/WbReviewContentAdapter.js";
import { WbWorkflowEditorAppAdapter as AdapterAbstraction } from "./WbWorkflowEditorAppAdapter.js";
import { WbWorkflowEditorAppAdapter } from "./WbWorkflowEditorAppAdapterImpl.js";

interface RenderedIconProps {
    label: string;
}

const contentAdapter = createFakeContentAdapter();

const createAdapter = () => {
    const container = new Container();
    container.registerInstance(WbReviewContentAdapter, contentAdapter);
    container.register(WbWorkflowEditorAppAdapter);

    return container.resolve(AdapterAbstraction);
};

describe("WbWorkflowEditorAppAdapter", () => {
    it("describes the Website Builder app", () => {
        const adapter = createAdapter();

        expect(adapter.appKind).toBe("wb");
        expect(adapter.panelLabel).toBe("Website Builder");
        expect(adapter.appliesToLabel).toBe("Website Builder");
        expect(adapter.contentAdapter).toBe(contentAdapter);
    });

    it("loads nothing on init", async () => {
        const adapter = createAdapter();

        await expect(adapter.init()).resolves.toBeUndefined();
    });

    it("renders the Pages icon for any model id", () => {
        const adapter = createAdapter();

        const node = adapter.renderModelIcon("wb.page");

        if (!React.isValidElement<RenderedIconProps>(node)) {
            throw new Error("The model icon is not an element.");
        }
        expect(node.props.label).toBe("Pages");
    });
});
