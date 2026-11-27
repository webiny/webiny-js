import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Mock } from "vitest";
import { Container } from "@webiny/di";
import { ListCache } from "@webiny/app-admin/features/listCache/index.js";
import { FormModelFeature } from "@webiny/app-admin/features/formModel/feature.js";
import { IdentityContextFeature } from "@webiny/app-admin/features/security/IdentityContext/feature.js";
import type { IRowNodeVM } from "@webiny/app-admin/features/formModel/abstractions.js";
import {
    CMS_MODEL_PUBLISHING_ENABLED_TAG,
    CMS_MODEL_SINGLETON_TAG
} from "@webiny/app-headless-cms-common";
import { ListModelGroupsUseCase } from "~/features/modelGroup/listModelGroups/abstractions.js";
import { CreateModelUseCase } from "~/features/model/createModel/abstractions.js";
import { ModelGroupsCache } from "~/features/modelGroup/abstractions.js";
import { ModelsCache } from "~/features/model/abstractions.js";
import { CmsModelError } from "~/features/model/CmsModelError.js";
import { NewContentModelPresenter as Abstraction } from "./abstractions.js";
import { NewContentModelPresenter } from "./NewContentModelPresenter.js";

describe("NewContentModelPresenter", () => {
    let presenter: Abstraction.Interface;
    let createModel: Mock;

    const setValue = (name: string, value: unknown) => {
        const rows = presenter.vm.form.layout as IRowNodeVM[];
        const field = rows.flatMap(row => row.fields).find(f => f.name === name);
        field!.onChange(value);
    };

    const fieldNames = () => {
        const rows = presenter.vm.form.layout as IRowNodeVM[];
        return rows.flatMap(row => row.fields).map(f => f.name);
    };

    const fillRequired = () => {
        setValue("name", "Settings");
        setValue("singularApiName", "setting");
        setValue("group", "blog");
    };

    beforeEach(() => {
        const container = new Container();
        IdentityContextFeature.register(container);
        FormModelFeature.register(container);

        const groups = new ListCache<any>();
        groups.setItems([{ slug: "blog", name: "Blog" }]);
        container.registerInstance(ModelGroupsCache, groups);
        container.registerInstance(ModelsCache, new ListCache<any>());
        container.registerInstance(ListModelGroupsUseCase, {
            execute: vi.fn(async () => [])
        } as unknown as ListModelGroupsUseCase.Interface);
        createModel = vi.fn(async (data: unknown) => data);
        container.registerInstance(CreateModelUseCase, {
            execute: createModel
        } as unknown as CreateModelUseCase.Interface);
        container.register(NewContentModelPresenter).inSingletonScope();

        presenter = container.resolve(Abstraction);
    });

    it("adds both tags for a single entry model with publishing", async () => {
        fillRequired();
        setValue("singleEntry", true);
        setValue("singleEntryPublishing", true);

        await presenter.save();

        expect(createModel.mock.calls[0][0].tags).toEqual([
            CMS_MODEL_SINGLETON_TAG,
            CMS_MODEL_PUBLISHING_ENABLED_TAG
        ]);
    });

    it("adds only the singleton tag when publishing is not ticked", async () => {
        fillRequired();
        setValue("singleEntry", true);

        await presenter.save();

        expect(createModel.mock.calls[0][0].tags).toEqual([CMS_MODEL_SINGLETON_TAG]);
    });

    it("ignores publishing when the model is not a single entry model", async () => {
        fillRequired();
        setValue("pluralApiName", "Settings");
        setValue("singleEntry", true);
        setValue("singleEntryPublishing", true);
        setValue("singleEntry", false);

        await presenter.save();

        expect(createModel.mock.calls[0][0].tags).toEqual([]);
    });

    it("shows the publishing field only for single entry models", () => {
        expect(fieldNames()).not.toContain("singleEntryPublishing");

        setValue("singleEntry", true);
        expect(fieldNames()).toContain("singleEntryPublishing");

        setValue("singleEntry", false);
        expect(fieldNames()).not.toContain("singleEntryPublishing");
    });

    describe("plural API name", () => {
        const pluralField = () => {
            const rows = presenter.vm.form.layout as IRowNodeVM[];
            return rows.flatMap(row => row.fields).find(f => f.name === "pluralApiName");
        };

        it("is hidden for single entry models and save succeeds without it", async () => {
            fillRequired();
            setValue("singleEntry", true);

            expect(fieldNames()).not.toContain("pluralApiName");

            await presenter.save();

            expect(createModel.mock.calls[0][0].pluralApiName).toBe("settingUnused");
        });

        it("is visible when single entry is off and fails when empty", async () => {
            fillRequired();

            expect(fieldNames()).toContain("pluralApiName");

            const result = await presenter.save();

            expect(result).toBeNull();
            expect(createModel).not.toHaveBeenCalled();
            expect(pluralField()!.validation.message).toBe("Plural API Name is required.");
        });

        it("fails when longer than 100 characters", async () => {
            fillRequired();
            setValue("pluralApiName", "A".repeat(101));

            expect(await presenter.save()).toBeNull();
            expect(createModel).not.toHaveBeenCalled();
        });

        it("fails for an invalid API name", async () => {
            fillRequired();
            setValue("pluralApiName", "settings list");

            expect(await presenter.save()).toBeNull();
            expect(createModel).not.toHaveBeenCalled();
        });

        it("passes for a valid API name", async () => {
            fillRequired();
            setValue("pluralApiName", "Settings");

            await presenter.save();

            expect(createModel.mock.calls[0][0].pluralApiName).toBe("Settings");
        });
    });

    describe("API errors", () => {
        const singularField = () => {
            const rows = presenter.vm.form.layout as IRowNodeVM[];
            return rows.flatMap(row => row.fields).find(f => f.name === "singularApiName");
        };

        it("shows an invalid field message under the field", async () => {
            fillRequired();
            setValue("pluralApiName", "Settings");
            createModel.mockRejectedValueOnce(
                new CmsModelError(
                    {
                        code: "Cms/Model/ValidationError",
                        message: "Validation failed.",
                        data: {
                            invalidFields: {
                                singularApiName: {
                                    code: "invalid_string",
                                    message: "The Singular API Name value is not valid.",
                                    data: { path: "singularApiName" }
                                }
                            }
                        }
                    },
                    "fallback"
                )
            );

            expect(await presenter.save()).toBeNull();

            expect(singularField()!.validation.message).toBe(
                "The Singular API Name value is not valid."
            );
            expect(presenter.vm.error).toBeNull();
            expect(presenter.vm.saving).toBe(false);
        });

        it("shows the message when there are no invalid fields and clears it on the next save", async () => {
            fillRequired();
            setValue("pluralApiName", "Settings");
            createModel.mockRejectedValueOnce(
                new CmsModelError(
                    {
                        code: "Cms/Model/AlreadyExists",
                        message: 'Content model with singularApiName "setting" already exists.'
                    },
                    "fallback"
                )
            );

            expect(await presenter.save()).toBeNull();
            expect(presenter.vm.error).toBe(
                'Content model with singularApiName "setting" already exists.'
            );

            await presenter.save();

            expect(presenter.vm.error).toBeNull();
        });

        const validationError = (invalidFields: Record<string, { message: string }>) => {
            const entries = Object.entries(invalidFields).map(([path, field]) => [
                path,
                { code: "invalid_string", message: field.message, data: { path } }
            ]);
            return new CmsModelError(
                {
                    code: "Cms/Model/ValidationError",
                    message: "Validation failed.",
                    data: { invalidFields: Object.fromEntries(entries) }
                },
                "fallback"
            );
        };

        it("drops the derived plural error for a single entry model when the singular one exists", async () => {
            fillRequired();
            setValue("singleEntry", true);
            createModel.mockRejectedValueOnce(
                validationError({
                    singularApiName: { message: "Bad singular." },
                    pluralApiName: { message: "Bad plural." }
                })
            );

            await presenter.save();

            expect(singularField()!.validation.message).toBe("Bad singular.");
            expect(presenter.vm.error).toBeNull();
        });

        it("shows the plural error under the singular field for a single entry model", async () => {
            fillRequired();
            setValue("singleEntry", true);
            createModel.mockRejectedValueOnce(
                validationError({ pluralApiName: { message: "Bad plural." } })
            );

            await presenter.save();

            expect(singularField()!.validation.message).toBe("Bad plural.");
            expect(presenter.vm.error).toBeNull();
        });

        it("keeps the plural error on the plural field for a regular model", async () => {
            fillRequired();
            setValue("pluralApiName", "Settings");
            createModel.mockRejectedValueOnce(
                validationError({ pluralApiName: { message: "Bad plural." } })
            );

            await presenter.save();

            const rows = presenter.vm.form.layout as IRowNodeVM[];
            const pluralField = rows
                .flatMap(row => row.fields)
                .find(f => f.name === "pluralApiName");
            expect(pluralField!.validation.message).toBe("Bad plural.");
            expect(singularField()!.validation.message).toBeFalsy();
            expect(presenter.vm.error).toBeNull();
        });

        it("clears the error on reset", async () => {
            fillRequired();
            setValue("pluralApiName", "Settings");
            createModel.mockRejectedValueOnce(new Error("Boom"));

            await presenter.save();
            expect(presenter.vm.error).toBe("Boom");

            presenter.reset();

            expect(presenter.vm.error).toBeNull();
        });
    });
});
