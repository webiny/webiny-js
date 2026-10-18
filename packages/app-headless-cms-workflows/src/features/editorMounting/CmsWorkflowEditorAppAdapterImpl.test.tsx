import React from "react";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { Container } from "@webiny/di";
import { ListCache } from "@webiny/app-admin/features/listCache/index.js";
import { ModelsCache } from "@webiny/app-headless-cms/features/model/abstractions.js";
import { ListModelsUseCase } from "@webiny/app-headless-cms/features/model/listModels/abstractions.js";
import type { CmsModel } from "@webiny/app-headless-cms-common/types/index.js";
import { createFakeContentAdapter } from "@webiny/app-workflows/editor/testing/fakeEditorAppAdapter.js";
import { CmsReviewContentAdapter } from "~/features/gateway/CmsReviewContentAdapter.js";
import { MODEL } from "~/testing/models.js";
import { CmsWorkflowEditorAppAdapter as AdapterAbstraction } from "./CmsWorkflowEditorAppAdapter.js";
import { CmsWorkflowEditorAppAdapter } from "./CmsWorkflowEditorAppAdapterImpl.js";

interface FontAwesomeElementProps {
    icon: string[];
}

interface RenderedIconProps {
    label: string;
    icon: React.ReactElement<FontAwesomeElementProps>;
}

const createModel = (modelId: string, name: string, icon: string): CmsModel => {
    return { ...MODEL, modelId, name, icon };
};

const contentAdapter = createFakeContentAdapter();

const createAdapter = (models: CmsModel[]) => {
    const cache = new ListCache<CmsModel>("modelId");
    // Mirrors `ListModelsRepository`: the first call fills the cache, later calls serve it.
    const execute = vi.fn(async () => {
        if (!cache.hasItems()) {
            cache.setItems(models);
        }
        return cache.getItems();
    });
    const container = new Container();
    container.registerInstance(ModelsCache, cache);
    container.registerInstance(ListModelsUseCase, { execute });
    container.registerInstance(CmsReviewContentAdapter, contentAdapter);
    container.register(CmsWorkflowEditorAppAdapter);
    const adapter = container.resolve(AdapterAbstraction);

    return { adapter, execute };
};

describe("CmsWorkflowEditorAppAdapter", () => {
    it("describes the CMS app", () => {
        const { adapter } = createAdapter([]);

        expect(adapter.appKind).toBe("cms");
        expect(adapter.panelLabel).toBe("Content models");
        expect(adapter.appliesToLabel).toBe("Headless CMS model");
        expect(adapter.contentAdapter).toBe(contentAdapter);
    });

    it("lists the models on init", async () => {
        const model = createModel("article", "Article", "fas/newspaper");
        const { adapter, execute } = createAdapter([model]);

        await adapter.init();

        expect(execute).toHaveBeenCalledTimes(1);
    });

    it("does not reject when the models cannot be listed, renders no icon and retries on the next init", async () => {
        const model = createModel("article", "Article", "fas/newspaper");
        const { adapter, execute } = createAdapter([model]);
        execute.mockRejectedValueOnce(new Error("Not authorized."));

        await expect(adapter.init()).resolves.toBeUndefined();
        const before = adapter.renderModelIcon("article");
        await adapter.init();
        const after = adapter.renderModelIcon("article");

        expect(before).toBeNull();
        expect(after).not.toBeNull();
        expect(execute).toHaveBeenCalledTimes(2);
    });

    it("renders the model icon from the cached model", async () => {
        const model = createModel("article", "Article", "fas/newspaper");
        const { adapter } = createAdapter([model]);
        await adapter.init();

        const node = adapter.renderModelIcon("article");

        if (!React.isValidElement<RenderedIconProps>(node)) {
            throw new Error("The model icon is not an element.");
        }
        expect(node.props.label).toBe("Article");
        expect(node.props.icon.props.icon).toEqual(["fas", "newspaper"]);
    });

    it("renders nothing for a model that is not cached", async () => {
        const { adapter } = createAdapter([createModel("article", "Article", "fas/newspaper")]);
        await adapter.init();

        const node = adapter.renderModelIcon("missing");

        expect(node).toBeNull();
    });

    it("renders nothing for a model without an icon", async () => {
        const { adapter } = createAdapter([createModel("article", "Article", "")]);
        await adapter.init();

        const node = adapter.renderModelIcon("article");

        expect(node).toBeNull();
    });
});
