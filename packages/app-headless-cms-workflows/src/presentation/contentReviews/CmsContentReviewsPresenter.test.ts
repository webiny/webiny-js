import { afterEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { Container } from "@webiny/di";
import { ListModelsUseCase } from "@webiny/app-headless-cms/features/model/listModels/abstractions.js";
import { Notifications } from "@webiny/app-admin/features/notifications/abstractions.js";
import { IdentityContextFeature } from "@webiny/app-admin/features/security/IdentityContext/feature.js";
import { IdentityContext } from "@webiny/app-admin/features/security/IdentityContext/abstractions.js";
import { Identity } from "@webiny/app-admin/domain/Identity.js";
import { CmsContentReviewsPresenter } from "./abstractions.js";
import type { ListedModel } from "./abstractions.js";
import { CmsContentReviewsPresenterFeature } from "./feature.js";

const FAILURE = {
    title: "Could not load the content types",
    description: "Content Reviews will not update live. Reload the page to try again."
};

const model = (
    modelId: string,
    name: string,
    overrides: Partial<ListedModel> = {}
): ListedModel => {
    return { modelId, name, tags: [], ...overrides };
};

const user = (id: string): Identity => {
    return Identity.createAuthenticated({
        id,
        type: "admin",
        displayName: "Maja Kos",
        roles: [],
        teams: [],
        permissions: [],
        profile: { external: false },
        currentTenant: { id: "root", name: "Root" },
        defaultTenant: { id: "root", name: "Root" }
    });
};

const flush = async (): Promise<void> => {
    await new Promise(resolve => {
        setTimeout(resolve, 0);
    });
};

interface SetupParams {
    signedIn?: boolean;
}

const setup = (execute: () => Promise<ListedModel[]>, params: SetupParams = {}) => {
    const notifications = { notify: vi.fn(), success: vi.fn(), warning: vi.fn(), error: vi.fn() };
    const container = new Container();
    container.registerInstance(ListModelsUseCase, {
        execute
    } as unknown as ListModelsUseCase.Interface);
    container.registerInstance(Notifications, notifications as unknown as Notifications.Interface);
    IdentityContextFeature.register(container);
    const identityContext = container.resolve(IdentityContext);
    if (params.signedIn !== false) {
        identityContext.setIdentity(user("user-1"));
    }
    CmsContentReviewsPresenterFeature.register(container);
    return {
        presenter: container.resolve(CmsContentReviewsPresenter),
        notifications,
        identityContext
    };
};

describe("CmsContentReviewsPresenter", () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

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
                { label: "Article", value: "article", app: "cms", icon: "devices_other" },
                { label: "Press release", value: "press", app: "cms", icon: "devices_other" }
            ]
        });
        expect(notifications.error).not.toHaveBeenCalled();
    });

    it("ends loading with nothing, logs the error and tells the viewer once when the list fails", async () => {
        const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
        const error = new Error("network");
        const { presenter, notifications } = setup(() => Promise.reject(error));

        await presenter.init();

        expect(presenter.vm).toEqual({ loading: false, namespaces: [], options: [] });
        expect(notifications.error).toHaveBeenCalledTimes(1);
        expect(notifications.error).toHaveBeenCalledWith(FAILURE);
        expect(consoleError).toHaveBeenCalledWith(
            "[CmsContentReviewsPresenter] Could not load the content types.",
            error
        );
    });

    it("lists the models once when init is called twice", async () => {
        const execute = vi.fn(async () => [model("article", "Article")]);
        const { presenter } = setup(execute);

        await Promise.all([presenter.init(), presenter.init()]);

        expect(execute).toHaveBeenCalledTimes(1);
    });

    it("lists the models once across a StrictMode init, dispose and init", async () => {
        const execute = vi.fn(async () => [model("article", "Article")]);
        const { presenter } = setup(execute);

        await presenter.init();
        presenter.dispose();
        await presenter.init();

        expect(execute).toHaveBeenCalledTimes(1);
    });

    it("tells the viewer once when init is called twice and the list fails", async () => {
        vi.spyOn(console, "error").mockImplementation(() => undefined);
        const execute = vi.fn(() => Promise.reject(new Error("network")));
        const { presenter, notifications } = setup(execute);

        await Promise.all([presenter.init(), presenter.init()]);

        expect(execute).toHaveBeenCalledTimes(1);
        expect(notifications.error).toHaveBeenCalledTimes(1);
    });

    it("lists nothing and says nothing while no one is signed in", async () => {
        const execute = vi.fn(async () => [model("article", "Article")]);
        const { presenter, notifications } = setup(execute, { signedIn: false });

        await presenter.init();
        await flush();

        expect(execute).not.toHaveBeenCalled();
        expect(notifications.error).not.toHaveBeenCalled();
        expect(presenter.vm).toEqual({ loading: true, namespaces: [], options: [] });
    });

    it("lists the models once when someone signs in", async () => {
        const execute = vi.fn(async () => [model("article", "Article")]);
        const { presenter, identityContext } = setup(execute, { signedIn: false });

        await presenter.init();
        identityContext.setIdentity(user("user-1"));
        await flush();
        identityContext.setIdentity(user("user-1"));
        await flush();

        expect(execute).toHaveBeenCalledTimes(1);
        expect(presenter.vm).toEqual({
            loading: false,
            namespaces: ["cms.article"],
            options: [{ label: "Article", value: "article", app: "cms", icon: "devices_other" }]
        });
    });

    it("retries a failed list when the identity changes", async () => {
        vi.spyOn(console, "error").mockImplementation(() => undefined);
        const execute = vi
            .fn<() => Promise<ListedModel[]>>()
            .mockRejectedValueOnce(new Error("network"))
            .mockResolvedValueOnce([model("article", "Article")]);
        const { presenter, notifications, identityContext } = setup(execute);

        await presenter.init();
        identityContext.clear();
        identityContext.setIdentity(user("user-1"));
        await flush();

        expect(execute).toHaveBeenCalledTimes(2);
        expect(notifications.error).toHaveBeenCalledTimes(1);
        expect(presenter.vm.namespaces).toEqual(["cms.article"]);
    });

    it("retries a failed list on a later init", async () => {
        vi.spyOn(console, "error").mockImplementation(() => undefined);
        const execute = vi
            .fn<() => Promise<ListedModel[]>>()
            .mockRejectedValueOnce(new Error("network"))
            .mockResolvedValueOnce([model("article", "Article")]);
        const { presenter } = setup(execute);

        await presenter.init();
        presenter.dispose();
        await presenter.init();

        expect(execute).toHaveBeenCalledTimes(2);
        expect(presenter.vm.namespaces).toEqual(["cms.article"]);
    });
});
