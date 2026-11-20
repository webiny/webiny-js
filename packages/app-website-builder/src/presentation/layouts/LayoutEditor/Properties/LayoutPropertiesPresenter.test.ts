import { describe, it, expect, beforeEach, vi } from "vitest";
import { Container } from "@webiny/di";
import { FormModelFactory } from "@webiny/app-admin/features/formModel/abstractions.js";
import { Notifications } from "@webiny/app-admin/features/notifications/abstractions.js";
import { GetLayoutUsageUseCase, UpdateLayoutUseCase } from "~/features/layouts/index.js";
import { LayoutPropertiesPresenter } from "./abstractions.js";
import { LayoutPropertiesPresenterRegistration } from "./LayoutPropertiesPresenter.js";

const init = { id: "blog#0002", title: "Blog", slug: "blog", isLanguageVersion: false };

describe("LayoutPropertiesPresenter", () => {
    const form = { vm: {}, submit: vi.fn() };
    const updateLayout = { execute: vi.fn() };
    const getLayoutUsage = { execute: vi.fn() };
    const notifications = { success: vi.fn(), warning: vi.fn(), notify: vi.fn() };
    let presenter: LayoutPropertiesPresenter.Interface;

    beforeEach(() => {
        vi.clearAllMocks();
        updateLayout.execute.mockImplementation(async (id: string, data: any) => ({
            id,
            properties: data.properties
        }));
        getLayoutUsage.execute.mockResolvedValue({
            pages: 0,
            isDefault: false,
            models: [{ modelId: "article", name: "Article" }]
        });

        const container = new Container();
        container.registerInstance(FormModelFactory, { create: () => form } as any);
        container.registerInstance(UpdateLayoutUseCase, updateLayout as any);
        container.registerInstance(GetLayoutUsageUseCase, getLayoutUsage);
        container.registerInstance(Notifications, notifications as any);
        container.register(LayoutPropertiesPresenterRegistration);
        presenter = container.resolve(LayoutPropertiesPresenter);
        presenter.init(init);
    });

    it("names the models that use the layout before renaming its slug, and renames it on the second save", async () => {
        form.submit.mockResolvedValue({ title: "Blog", slug: "news" });

        expect(await presenter.submit()).toBeNull();
        expect(getLayoutUsage.execute).toHaveBeenCalledWith("blog#0002");
        expect(updateLayout.execute).not.toHaveBeenCalled();
        expect(presenter.vm.renameWarning).toContain('the "Article" model');
        expect(presenter.vm.renameWarning).toContain('"blog"');

        const saved = await presenter.submit();
        expect(saved?.properties.slug).toBe("news");
        expect(updateLayout.execute).toHaveBeenCalledWith("blog#0002", {
            properties: { title: "Blog", slug: "news" }
        });
    });

    it("warns again for a different new slug", async () => {
        form.submit.mockResolvedValue({ title: "Blog", slug: "news" });
        await presenter.submit();

        form.submit.mockResolvedValue({ title: "Blog", slug: "stories" });
        expect(await presenter.submit()).toBeNull();
        expect(presenter.vm.renameWarning).toContain('"stories"');
        expect(updateLayout.execute).not.toHaveBeenCalled();
    });

    it("saves without a warning when no model uses the layout, or the slug is unchanged", async () => {
        form.submit.mockResolvedValue({ title: "Blog posts", slug: "blog" });
        expect(await presenter.submit()).not.toBeNull();
        expect(getLayoutUsage.execute).not.toHaveBeenCalled();

        getLayoutUsage.execute.mockResolvedValue({ pages: 3, isDefault: true, models: [] });
        form.submit.mockResolvedValue({ title: "Blog", slug: "news" });
        expect(await presenter.submit()).not.toBeNull();
        expect(presenter.vm.renameWarning).toBeNull();
    });

    it("clears the warning when the dialog opens again", async () => {
        form.submit.mockResolvedValue({ title: "Blog", slug: "news" });
        await presenter.submit();

        presenter.init(init);
        expect(presenter.vm.renameWarning).toBeNull();
        expect(await presenter.submit()).toBeNull();
    });
});
