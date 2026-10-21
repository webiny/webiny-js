import { describe, it, expect, vi } from "vitest";
import { Container } from "@webiny/di";
import { FormModelFeature } from "@webiny/app-admin/features/formModel/feature.js";
import { IdentityContextFeature } from "@webiny/app-admin/features/security/IdentityContext/feature.js";
import { FormModelFactory } from "@webiny/app-admin/features/formModel/abstractions.js";
import { Notifications } from "@webiny/app-admin/features/notifications/abstractions.js";
import type { IFormModel, IRowNodeVM } from "@webiny/app-admin";
import {
    ListLanguagesRepository,
    ListLanguagesUseCase,
    type LanguageDto
} from "@webiny/languages/admin/features/listLanguages/abstractions.js";
import { type CreateLayoutData, CreateLayoutUseCase } from "~/features/layouts/index.js";
import { AddLayoutLanguageModifier } from "./AddLayoutLanguageModifier.js";
import { CreateLayoutPresenter } from "./abstractions.js";
import { CreateLayoutPresenterRegistration } from "./CreateLayoutPresenter.js";

const english: LanguageDto = { id: "en", code: "en", name: "English", isDefault: true };
const german: LanguageDto = { id: "de", code: "de", name: "German" };

function createLanguageMocks(languages: LanguageDto[]) {
    const repository = {
        execute: async () => languages,
        getLanguages: () => languages
    };
    const useCase = {
        execute: async () => languages
    };
    return { useCase, repository };
}

function createBaseForm() {
    const container = new Container();
    IdentityContextFeature.register(container);
    FormModelFeature.register(container);
    const factory = container.resolve(FormModelFactory);

    return factory.create({
        fields: fields => ({
            title: fields.text().label("Title").required("Title is required")
        }),
        layout: layout => [layout.row("title")]
    });
}

const visibleFieldNames = (form: IFormModel) => {
    return form.vm.layout
        .filter((node): node is IRowNodeVM => node.type === "row")
        .flatMap(row => row.fields.filter(field => field.visible).map(field => field.name));
};

function buildForm(languages: LanguageDto[]) {
    const { useCase, repository } = createLanguageMocks(languages);
    const modifier = new AddLayoutLanguageModifier(useCase, repository);
    const form = createBaseForm();
    modifier.modifyForm(form);

    const mapFromForm = () => {
        const input: CreateLayoutData = { title: "Main" };
        modifier.mapFromForm(form.getData(), input);
        return input;
    };

    return { form, mapFromForm };
}

describe("AddLayoutLanguageModifier", () => {
    it("adds no field and stores no language without languages", () => {
        const { form, mapFromForm } = buildForm([]);

        expect(visibleFieldNames(form)).toEqual(["title"]);
        expect(form.field("language").getValue()).toBeFalsy();
        expect(mapFromForm()).toEqual({ title: "Main" });
    });

    it("assigns the only language, without a field", () => {
        const { form, mapFromForm } = buildForm([english]);

        expect(visibleFieldNames(form)).toEqual(["title"]);
        expect(form.field("language").getValue()).toBe("en");
        expect(mapFromForm()).toEqual({ title: "Main", language: "en" });
    });

    it("offers a select of the languages, with the default one preselected", () => {
        const { form, mapFromForm } = buildForm([german, english]);

        expect(visibleFieldNames(form)).toEqual(["language", "title"]);
        expect(form.field("language").vm.options).toEqual([
            { label: "German (de)", value: "de" },
            { label: "English (en)", value: "en" }
        ]);
        expect(form.field("language").vm.required).toBe(false);
        expect(form.field("language").getValue()).toBe("en");
        expect(mapFromForm()).toEqual({ title: "Main", language: "en" });

        form.field("language").setValue("de");
        expect(mapFromForm()).toEqual({ title: "Main", language: "de" });
    });

    it("stores no language once the select is cleared", () => {
        const { form, mapFromForm } = buildForm([german, english]);

        form.field("language").setValue("");
        expect(mapFromForm()).toEqual({ title: "Main" });

        form.field("language").setValue(null);
        expect(mapFromForm()).toEqual({ title: "Main" });
    });

    it("never stores a language the site doesn't have", () => {
        const { form, mapFromForm } = buildForm([german, english]);

        form.field("language").setValue("fr");
        expect(mapFromForm()).toEqual({ title: "Main" });
    });
});

describe("CreateLayoutPresenter", () => {
    function createPresenter(languages: LanguageDto[], { init = true } = {}) {
        const createLayout = {
            execute: vi.fn(async (data: CreateLayoutData) => ({ id: "new#0001", ...data }))
        };
        const notifications = { success: vi.fn(), warning: vi.fn(), notify: vi.fn() };
        const { useCase, repository } = createLanguageMocks(languages);

        const container = new Container();
        IdentityContextFeature.register(container);
        FormModelFeature.register(container);
        container.registerInstance(ListLanguagesUseCase, useCase);
        container.registerInstance(ListLanguagesRepository, repository);
        container.registerInstance(CreateLayoutUseCase, createLayout as any);
        container.registerInstance(Notifications, notifications as any);
        container.register(AddLayoutLanguageModifier);
        container.register(CreateLayoutPresenterRegistration);

        const presenter = container.resolve(CreateLayoutPresenter);
        if (init) {
            presenter.init();
        }

        return { presenter, createLayout, notifications };
    }

    it("has no form until init() builds it, so nothing typed before init() is thrown away", async () => {
        const { presenter } = createPresenter([english], { init: false });

        expect(presenter.vm.form).toBeNull();
        expect(await presenter.submit()).toBeNull();
        presenter.init();
        expect(presenter.vm.form).not.toBeNull();
    });

    it("doesn't create a layout without a title", async () => {
        const { presenter, createLayout } = createPresenter([english]);

        expect(await presenter.submit()).toBeNull();
        expect(createLayout.execute).not.toHaveBeenCalled();
    });

    it("creates a layout with the title and the language", async () => {
        const { presenter, createLayout } = createPresenter([german, english]);

        const title = presenter.vm
            .form!.layout.filter((node): node is IRowNodeVM => node.type === "row")
            .flatMap(row => row.fields)
            .find(field => field.name === "title")!;
        title.onChange("  Main layout  ");
        title.onBlur();

        const layout = await presenter.submit();

        expect(createLayout.execute).toHaveBeenCalledWith({
            title: "Main layout",
            slug: "main-layout",
            language: "en"
        });
        expect(layout?.id).toBe("new#0001");
    });

    it("fills in the slug from the title until the slug is edited", async () => {
        const { presenter, createLayout } = createPresenter([german, english]);
        const field = (name: string) =>
            presenter.vm
                .form!.layout.filter((node): node is IRowNodeVM => node.type === "row")
                .flatMap(row => row.fields)
                .find(item => item.name === name)!;

        field("title").onChange("Blog");
        field("title").onBlur();
        expect(field("slug").value).toBe("blog");

        field("title").onChange("Blog posts");
        field("title").onBlur();
        expect(field("slug").value).toBe("blog-posts");

        field("slug").onChange("My Posts ");
        field("title").onChange("Articles");
        field("title").onBlur();
        expect(field("slug").value).toBe("my-posts-");

        await presenter.submit();
        expect(createLayout.execute).toHaveBeenCalledWith({
            title: "Articles",
            slug: "my-posts",
            language: "en"
        });
    });

    it("notifies when the layout can't be created", async () => {
        const { presenter, createLayout, notifications } = createPresenter([]);
        createLayout.execute.mockRejectedValue(new Error("Not allowed."));

        const title = presenter.vm
            .form!.layout.filter((node): node is IRowNodeVM => node.type === "row")
            .flatMap(row => row.fields)
            .find(field => field.name === "title")!;
        title.onChange("Main");
        title.onBlur();

        expect(await presenter.submit()).toBeNull();
        expect(createLayout.execute).toHaveBeenCalledWith({ title: "Main", slug: "main" });
        expect(notifications.warning).toHaveBeenCalledWith({
            title: "Could not create the layout",
            description: "Not allowed."
        });
    });
});
