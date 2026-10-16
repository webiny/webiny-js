import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { Container } from "@webiny/di";
import { ListModelsUseCase } from "@webiny/app-headless-cms/features/model/listModels/abstractions.js";
import { Notifications } from "@webiny/app-admin/features/notifications/abstractions.js";
import { CmsContentReviewsPresenter } from "./abstractions.js";
import type { ListedModel } from "./abstractions.js";
import { CmsContentReviewsPresenterFeature } from "./feature.js";

const model = (
    modelId: string,
    name: string,
    overrides: Partial<ListedModel> = {}
): ListedModel => {
    return { modelId, name, tags: [], ...overrides };
};

const setup = (execute: () => Promise<ListedModel[]>) => {
    const notifications = { notify: vi.fn(), success: vi.fn(), warning: vi.fn(), error: vi.fn() };
    const container = new Container();
    container.registerInstance(ListModelsUseCase, {
        execute
    } as unknown as ListModelsUseCase.Interface);
    container.registerInstance(Notifications, notifications as unknown as Notifications.Interface);
    CmsContentReviewsPresenterFeature.register(container);
    return { presenter: container.resolve(CmsContentReviewsPresenter), notifications };
};

describe("CmsContentReviewsPresenter", () => {
    it("starts loading with nothing", () => {
        const { presenter } = setup(() => new Promise(() => undefined));

        expect(presenter.vm).toEqual({ loading: true, namespaces: [], options: [] });
    });

    it("exposes the namespaces and filter options of the models a workflow can bind, sorted by name", async () => {
        const { presenter, notifications } = setup(async () => [
            model("press", "Press release"),
            model("article", "Article"),
            model("hidden", "Hidden", { tags: ["$publishing:false"] }),
            model("gone", "Gone", { isBeingDeleted: true })
        ]);

        await presenter.init();

        expect(presenter.vm).toEqual({
            loading: false,
            namespaces: ["cms.article", "cms.press"],
            options: [
                { label: "Article", value: "article" },
                { label: "Press release", value: "press" }
            ]
        });
        expect(notifications.error).not.toHaveBeenCalled();
    });

    it("ends loading with nothing and tells the viewer once when the list fails", async () => {
        const { presenter, notifications } = setup(() => Promise.reject(new Error("network")));

        await presenter.init();

        expect(presenter.vm).toEqual({ loading: false, namespaces: [], options: [] });
        expect(notifications.error).toHaveBeenCalledTimes(1);
        expect(notifications.error).toHaveBeenCalledWith({
            title: "Could not load the content types",
            description: "Content Reviews will not update live. Reload the page to try again."
        });
    });

    it("lists the models once when init is called twice", async () => {
        const execute = vi.fn(async () => [model("article", "Article")]);
        const { presenter } = setup(execute);

        await Promise.all([presenter.init(), presenter.init()]);

        expect(execute).toHaveBeenCalledTimes(1);
    });

    it("tells the viewer once when init is called twice and the list fails", async () => {
        const execute = vi.fn(() => Promise.reject(new Error("network")));
        const { presenter, notifications } = setup(execute);

        await Promise.all([presenter.init(), presenter.init()]);

        expect(execute).toHaveBeenCalledTimes(1);
        expect(notifications.error).toHaveBeenCalledTimes(1);
    });
});
