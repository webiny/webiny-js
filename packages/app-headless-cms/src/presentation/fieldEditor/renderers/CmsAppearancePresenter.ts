import { createAbstraction, createFeature } from "@webiny/feature/admin";
import {
    CmsFieldRenderer,
    type ICmsFieldRenderer
} from "~/presentation/fieldRenderers/abstractions.js";
import type {
    IFieldVM,
    IObjectFieldVM,
    IValueOption,
    LayoutNodeVM
} from "@webiny/app-admin/features/formModel/abstractions.js";

export interface IRendererOption {
    name: string;
    value: string;
    description: string;
}

export interface ICmsAppearanceVM {
    renderers: IRendererOption[];
    selectedValue: string;
    settingsLayout: LayoutNodeVM[];
    hasRenderers: boolean;
}

export interface ICmsAppearancePresenter {
    getVm(field: IObjectFieldVM): ICmsAppearanceVM;
    selectRenderer(field: IObjectFieldVM, name: string): void;
    autoSelectFirst(field: IObjectFieldVM): void;
}

const HIDDEN_RENDERER = "hidden";

function sortHiddenLast<T extends { value: string | number }>(items: T[]): T[] {
    return [...items].sort((a, b) => {
        if (a.value === HIDDEN_RENDERER) {
            return 1;
        }
        if (b.value === HIDDEN_RENDERER) {
            return -1;
        }
        return 0;
    });
}

class CmsAppearancePresenterImpl implements ICmsAppearancePresenter {
    constructor(private allRenderers: ICmsFieldRenderer[]) {}

    getVm(field: IObjectFieldVM): ICmsAppearanceVM {
        const nameField = this.findField(field, "name");
        const selectedValue = nameField ? String(nameField.value ?? "") : "";
        const options = nameField?.options ?? [];

        const renderers = this.buildRendererOptions(options);
        const settingsLayout = this.buildSettingsLayout(field);

        return {
            renderers,
            selectedValue,
            settingsLayout,
            hasRenderers: renderers.length > 0
        };
    }

    selectRenderer(field: IObjectFieldVM, name: string) {
        const nameField = this.findField(field, "name");
        if (nameField) {
            nameField.onChange(name);
        }
    }

    autoSelectFirst(field: IObjectFieldVM) {
        const nameField = this.findField(field, "name");
        if (!nameField) {
            return;
        }
        const options = nameField.options ?? [];
        const value = String(nameField.value ?? "");
        const isSelected = options.some(o => String(o.value) === value);
        if (!isSelected && options.length > 0) {
            const sorted = sortHiddenLast(options);
            nameField.onChange(sorted[0].value);
        }
    }

    private findField(field: IObjectFieldVM, name: string): IFieldVM | undefined {
        return field.fields.find(f => f.name === name);
    }

    private buildRendererOptions(options: IValueOption[]): IRendererOption[] {
        return sortHiddenLast(options).map(option => {
            const renderer = this.allRenderers.find(r => r.rendererName === option.value);
            return {
                name: option.label,
                value: String(option.value),
                description: renderer ? renderer.description : ""
            };
        });
    }

    private buildSettingsLayout(field: IObjectFieldVM): LayoutNodeVM[] {
        return field.layout.filter(node => {
            if (node.type !== "row") {
                return true;
            }
            return !node.fields.some(f => f.name === "name");
        });
    }
}

export const CmsAppearancePresenter =
    createAbstraction<ICmsAppearancePresenter>("CmsAppearancePresenter");

export namespace CmsAppearancePresenter {
    export type Interface = ICmsAppearancePresenter;
    export type ViewModel = ICmsAppearanceVM;
    export type RendererOption = IRendererOption;
}

const CmsAppearancePresenterRegistration = CmsAppearancePresenter.createImplementation({
    implementation: CmsAppearancePresenterImpl,
    dependencies: [[CmsFieldRenderer, { multiple: true }]]
});

export const CmsAppearancePresenterFeature = createFeature({
    name: "CmsFieldEditor/AppearancePresenter",
    register(container) {
        container.register(CmsAppearancePresenterRegistration);
    },
    resolve(container) {
        return {
            presenter: container.resolve(CmsAppearancePresenter)
        };
    }
});
