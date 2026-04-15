import { describe, it, expect } from "vitest";
import { FormModel as FormModelImpl } from "@webiny/app-admin/features/formModel/FormModel.js";
import type { IFormModel, IFormModelConfig, IRowNodeVM } from "@webiny/app-admin";
import type { LanguageDto } from "@webiny/languages/admin/features/listLanguages/abstractions.js";
import { AddLanguageModifier } from "./AddLanguageModifier.js";
import { PagePath } from "~/shared/PagePath.js";
import type { IPageType, ICreatePageFormModifier } from "./abstractions.js";

/**
 * Creates a mock use case + repository pair for the AddLanguageModifier.
 * Languages are pre-populated (simulating a completed fetch).
 */
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

/**
 * Creates the same base form that CreatePagePresenter builds,
 * without requiring DI or the page type cache.
 */
function createBaseForm(config?: Partial<IFormModelConfig>) {
    return new FormModelImpl({
        fields: fields => ({
            title: fields
                .text()
                .label("Title")
                .required("Title is required")
                .onBlur((value, f) => {
                    const currentPath = f.field("path").getValue();
                    if (currentPath) {
                        return;
                    }
                    f.field("path").setValue(PagePath.fromTitle(String(value)).toString());
                }),
            path: fields
                .text()
                .label("Path")
                .required("Path is required")
                .beforeChange(value => {
                    return PagePath.create(String(value)).slugify().toString();
                }),
            pageType: fields.text().hidden().defaultValue("staticPage")
        }),
        layout: layout => [layout.row("title"), layout.row("path")],
        ...config
    });
}

/**
 * Helper: set title and blur to trigger path generation.
 */
function setTitleAndBlur(form: IFormModel, value: string) {
    form.field("title").setValue(value);
    form.field("title").blur();
}

describe("CreatePage base form", () => {
    it("should create a form with title, path, and hidden pageType", () => {
        const form = createBaseForm();
        expect(form.field("title")).toBeDefined();
        expect(form.field("path")).toBeDefined();
        expect(form.field("pageType")).toBeDefined();
    });

    it("should include pageType in getData but not in layout", () => {
        const form = createBaseForm();
        const data = form.getData();
        expect(data.pageType).toBe("staticPage");

        const fieldNames = form.vm.layout
            .filter((n): n is IRowNodeVM => n.type === "row")
            .flatMap(row => row.fields.map(f => f.name));
        expect(fieldNames).not.toContain("pageType");
    });

    it("should auto-generate path from title on blur", () => {
        const form = createBaseForm();
        setTitleAndBlur(form, "Hello World");
        expect(form.field("path").getValue()).toBe("/hello-world");
    });

    it("should not auto-generate path on setValue alone (before blur)", () => {
        const form = createBaseForm();
        form.field("title").setValue("Hello World");
        expect(form.field("path").getValue()).toBeNull();
    });

    it("should not overwrite path when manually edited", () => {
        const form = createBaseForm();
        setTitleAndBlur(form, "Hello World");
        form.field("path").setValue("/custom-path");
        setTitleAndBlur(form, "New Title");
        expect(form.field("path").getValue()).toBe("/custom-path");
    });

    it("should return data on valid submit", async () => {
        const form = createBaseForm();
        form.field("title").setValue("My Page");
        form.field("path").setValue("/my-page");

        const result = await form.submit();
        expect(result).toEqual({
            title: "My Page",
            path: "/my-page",
            pageType: "staticPage"
        });
    });

    it("should return false on invalid submit", async () => {
        const form = createBaseForm();
        const result = await form.submit();
        expect(result).toBe(false);
        expect(form.errors.length).toBeGreaterThan(0);
    });
});

describe("PageType + Modifier 3-layer architecture", () => {
    /**
     * Simulates the 3-layer build order used by CreatePagePresenter:
     * 1. Base form (title, path, pageType)
     * 2. Page type modify
     * 3. Cross-cutting modifiers
     */
    function buildForm(pageType: IPageType, modifiers: ICreatePageFormModifier[] = []): IFormModel {
        const form = createBaseForm();
        pageType.modifyForm?.(form);
        for (const modifier of modifiers) {
            modifier.modifyForm(form);
        }
        return form;
    }

    const staticPageType: IPageType = {
        name: "static",
        label: "Static Page",
        modifyForm() {
            // no-op
        }
    };

    const productPageType: IPageType = {
        name: "product",
        label: "Product Page",
        modifyForm(form) {
            form.fields(fields => ({
                product: fields
                    .select()
                    .label("Product")
                    .required("Product is required")
                    .options([
                        { label: "Shoes", value: "shoes" },
                        { label: "Hats", value: "hats" }
                    ])
            }));
            form.field("title").setDisabled(true);
            form.field("path").setDisabled(true);
            form.layout(layout => [layout.row("product").before("title")]);
        }
    };

    it("should leave base form unchanged for static page type", () => {
        const form = buildForm(staticPageType);
        const fieldNames = form.vm.layout
            .filter((n): n is IRowNodeVM => n.type === "row")
            .flatMap(row => row.fields.map(f => f.name));
        expect(fieldNames).toEqual(["title", "path"]);
    });

    it("should add product field and disable title/path for product page type", () => {
        const form = buildForm(productPageType);
        const fieldNames = form.vm.layout
            .filter((n): n is IRowNodeVM => n.type === "row")
            .flatMap(row => row.fields.map(f => f.name));
        expect(fieldNames).toEqual(["product", "title", "path"]);

        expect(form.field("title").vm.disabled).toBe(true);
        expect(form.field("path").vm.disabled).toBe(true);
    });

    it("should include product in getData", () => {
        const form = buildForm(productPageType);
        form.field("product").setValue("shoes");
        const data = form.getData();
        expect(data.product).toBe("shoes");
    });

    it("should apply cross-cutting modifier after page type", () => {
        const langs: LanguageDto[] = [
            { id: "en", code: "en", name: "English", isDefault: true },
            { id: "de", code: "de", name: "German" }
        ];
        const { useCase, repository } = createLanguageMocks(langs);
        const languageModifier = new AddLanguageModifier(useCase, repository);

        const form = buildForm(productPageType, [languageModifier]);
        const fieldNames = form.vm.layout
            .filter((n): n is IRowNodeVM => n.type === "row")
            .flatMap(row => row.fields.map(f => f.name));

        // language before title (from modifier), product before title (from page type)
        expect(fieldNames).toEqual(["product", "language", "title", "path"]);
    });

    it("should apply cross-cutting modifier to static page type too", () => {
        const langs: LanguageDto[] = [
            { id: "en", code: "en", name: "English", isDefault: true },
            { id: "de", code: "de", name: "German" }
        ];
        const { useCase, repository } = createLanguageMocks(langs);
        const languageModifier = new AddLanguageModifier(useCase, repository);

        const form = buildForm(staticPageType, [languageModifier]);
        const fieldNames = form.vm.layout
            .filter((n): n is IRowNodeVM => n.type === "row")
            .flatMap(row => row.fields.map(f => f.name));

        expect(fieldNames).toEqual(["language", "title", "path"]);
    });
});

describe("Form rebuild on page type switch", () => {
    const staticPageType: IPageType = {
        name: "static",
        label: "Static Page",
        modifyForm() {
            // no-op
        }
    };

    const productPageType: IPageType = {
        name: "product",
        label: "Product Page",
        modifyForm(form) {
            form.fields(fields => ({
                product: fields
                    .select()
                    .label("Product")
                    .required("Product is required")
                    .options([
                        { label: "Shoes", value: "shoes" },
                        { label: "Hats", value: "hats" }
                    ])
            }));
            form.field("title").setDisabled(true);
            form.field("path").setDisabled(true);
            form.layout(layout => [layout.row("product").before("title")]);
        }
    };

    const pageTypes: Record<string, IPageType> = {
        static: staticPageType,
        product: productPageType
    };

    /**
     * Simulates the presenter's changePageType: getData → rebuild → setData.
     * The real presenter sets `this.selectedPageType` before `buildForm()`,
     * which sets the hidden field's defaultValue. Here we just rebuild and restore.
     */
    function changePageType(
        currentForm: IFormModel,
        newType: string,
        modifiers: ICreatePageFormModifier[] = []
    ): IFormModel {
        const previousData = currentForm.getData();
        const form = createBaseForm();
        pageTypes[newType].modifyForm?.(form);
        for (const modifier of modifiers) {
            modifier.modifyForm(form);
        }
        form.setData(previousData);
        return form;
    }

    it("should preserve common field values when switching page types", () => {
        // Start with static page, fill in title and path.
        const staticForm = createBaseForm();
        staticPageType.modifyForm?.(staticForm);
        staticForm.field("title").setValue("My Page");
        staticForm.field("path").setValue("/my-page");

        // Switch to product page.
        const productForm = changePageType(staticForm, "product");

        expect(productForm.field("title").getValue()).toBe("My Page");
        expect(productForm.field("path").getValue()).toBe("/my-page");
    });

    it("should drop page-type-specific fields on switch", () => {
        // Start with product page, select a product.
        const productForm = createBaseForm();
        productPageType.modifyForm?.(productForm);
        productForm.field("product").setValue("shoes");

        // Switch to static page — product field should not exist.
        const staticForm = changePageType(productForm, "static");

        const fieldNames = staticForm.vm.layout
            .filter((n): n is IRowNodeVM => n.type === "row")
            .flatMap(row => row.fields.map(f => f.name));
        expect(fieldNames).toEqual(["title", "path"]);
        expect(staticForm.getData()).not.toHaveProperty("product");
    });

    it("should preserve cross-cutting modifier values across page type switch", () => {
        const langs: LanguageDto[] = [
            { id: "en", code: "en", name: "English", isDefault: true },
            { id: "de", code: "de", name: "German" }
        ];
        const { useCase, repository } = createLanguageMocks(langs);
        const languageModifier = new AddLanguageModifier(useCase, repository);

        // Start with static page + language modifier.
        const staticForm = createBaseForm();
        staticPageType.modifyForm?.(staticForm);
        languageModifier.modifyForm(staticForm);
        staticForm.field("title").setValue("Demo");
        // Language is auto-assigned "en" by the modifier reaction.

        const langValue = staticForm.field("language").getValue();
        expect(langValue).toBe("en");

        // Switch to product page with same modifier.
        const productForm = changePageType(staticForm, "product", [languageModifier]);

        expect(productForm.field("language").getValue()).toBe("en");
        expect(productForm.field("title").getValue()).toBe("Demo");
    });

    it("should preserve hidden field values across rebuild", () => {
        const staticForm = createBaseForm();
        staticPageType.modifyForm?.(staticForm);
        expect(staticForm.getData().pageType).toBe("staticPage");

        // Switch to product — setData restores pageType from previous form.
        const productForm = changePageType(staticForm, "product");

        // The hidden pageType field is preserved via setData.
        // In the real presenter, buildForm() sets defaultValue to the new type,
        // so the hidden field gets the correct value regardless.
        expect(productForm.field("pageType").getValue()).toBe("staticPage");
    });
});
