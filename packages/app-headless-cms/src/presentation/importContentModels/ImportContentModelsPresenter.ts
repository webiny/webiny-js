import { makeAutoObservable, runInAction } from "mobx";
import type { CmsGroup, CmsModel } from "@webiny/app-headless-cms-common/types/index.js";
import type { ImportGroupData, ImportModelData } from "./types.js";
import { ImportAction } from "./types.js";
import type { ImportStructureVariablesGroup, ImportStructureVariablesModel } from "./graphql.js";
import { ValidateImportUseCase } from "~/features/model/importModels/abstractions.js";
import { ImportModelsUseCase } from "~/features/model/importModels/abstractions.js";
import {
    ImportContentModelsPresenter as Abstraction,
    type IImportContentModelsPresenter,
    type IImportContentModelsPresenterViewModel
} from "./abstractions.js";

interface Data {
    groups: CmsGroup[];
    models: CmsModel[];
}

type Selected = Map<string, string[]>;

interface CreateSelectedParams {
    previous: Selected;
    models: Pick<ImportModelData, "id" | "related" | "imported">[];
    item: Pick<ImportModelData, "id" | "related">;
}

const createSelected = (params: CreateSelectedParams): Selected => {
    const { previous, models, item } = params;
    let selected = new Map(previous);

    selected.set(item.id, item.related);
    for (const id of item.related) {
        const model = models.find(model => model.id === id);
        if (!model) {
            continue;
        } else if (selected.has(model.id) || model.imported) {
            continue;
        }
        const related = createSelected({
            previous: selected,
            models,
            item: model
        });
        selected = new Map([...selected, ...related]);
    }

    return selected;
};

interface DataToImportResult {
    groups: ImportStructureVariablesGroup[];
    models: ImportStructureVariablesModel[];
}

class ImportContentModelsPresenterImpl implements IImportContentModelsPresenter {
    private _data: Data | null = null;
    private _loading = false;
    private _groups: ImportGroupData[] = [];
    private _models: ImportModelData[] = [];
    private _file: File | null = null;
    private _errors: string[] = [];
    private _validated = false;
    private _selected: Selected = new Map();

    constructor(
        private validateUseCase: ValidateImportUseCase.Interface,
        private importUseCase: ImportModelsUseCase.Interface
    ) {
        makeAutoObservable<ImportContentModelsPresenterImpl, "validateUseCase" | "importUseCase">(
            this,
            {
                validateUseCase: false,
                importUseCase: false
            }
        );
    }

    get vm(): IImportContentModelsPresenterViewModel {
        return {
            data: this._data,
            loading: this._loading,
            groups: this._groups,
            models: this._models,
            file: this._file,
            errors: this._errors,
            validated: this._validated
        };
    }

    hasSelected(): boolean {
        return this._selected.size > 0;
    }

    isModelSelected(item: Pick<ImportModelData, "id">): boolean {
        return this._selected.has(item.id);
    }

    isModelRelated({ id: target }: Pick<ImportModelData, "id">): boolean {
        for (const id of this._selected.keys()) {
            if (id === target) {
                continue;
            }
            const related = this._selected.get(id);
            if (related && related.includes(target)) {
                return true;
            }
        }
        return false;
    }

    onFile(file: File): void {
        const reader = new FileReader();
        reader.addEventListener("load", event => {
            try {
                const data = this.parseFileContent(event.target?.result);
                runInAction(() => {
                    this._models = [];
                    this._groups = [];
                    this._selected = new Map();
                    this._errors = [];
                    this._validated = false;
                    this._file = file;
                    this._data = data;
                });
            } catch (ex: any) {
                runInAction(() => {
                    this._file = file;
                    this._selected = new Map();
                    this._validated = false;
                    this._groups = [];
                    this._models = [];
                    this._data = null;
                    this._errors = [ex.message];
                });
            }
        });
        reader.readAsText(file);
    }

    onFileError(error: string): void {
        this._file = null;
        this._errors = [error];
    }

    toggleModel(item: Pick<ImportModelData, "id" | "name" | "related">): void {
        if (this.isModelSelected(item)) {
            this.removeModel(item);
        } else {
            this.addModel(item);
        }
    }

    async handleModelsValidation(): Promise<void> {
        if (!this._data) {
            return;
        }

        this._loading = true;

        try {
            const data = await this.validateUseCase.execute(this._data as any);

            runInAction(() => {
                this._loading = false;
                this._groups = data.groups.map(group => ({
                    id: group.group.id,
                    name: group.group.name,
                    slug: group.group.slug,
                    error: group.error,
                    action: group.action
                }));
                this._models = data.models.map(model => ({
                    id: model.model.modelId,
                    name: model.model.name,
                    group: model.model.group,
                    related: model.related || [],
                    error: model.error,
                    action: model.action
                }));
                this._validated = true;
            });
        } catch (ex: any) {
            runInAction(() => {
                this._loading = false;
                this._errors = [ex.message];
            });
        }
    }

    async handleModelsImport(): Promise<void> {
        if (!this._data || !this._groups.length || !this._models.length || !this._selected.size) {
            return;
        }

        this._loading = true;

        const dataToImport = this.getDataToImport();

        try {
            const data = await this.importUseCase.execute(dataToImport);

            runInAction(() => {
                this._loading = false;
                this._selected = new Map();
                this._groups = this._groups.map(group => {
                    const result = data.groups.find(item => item.group.id === group.id);
                    return {
                        id: result?.group.id || group.id,
                        name: result?.group.name || group.name,
                        slug: result?.group.slug || group.slug,
                        error: result?.error || group.error,
                        imported: result ? result.imported : group.imported
                    };
                });
                this._models = this._models.map(model => {
                    const result = data.models.find(item => item.model.modelId === model.id);
                    return {
                        id: result?.model.modelId || model.id,
                        name: result?.model.name || model.name,
                        group: result?.model.group || model.group,
                        related: result?.related || model.related || [],
                        action: result?.action || model.action,
                        error: result?.error || model.error,
                        imported: result ? result.imported : model.imported
                    };
                });
                this._validated = true;
            });
        } catch (ex: any) {
            runInAction(() => {
                this._loading = false;
                this._errors = [ex.message];
            });
        }
    }

    reset(): void {
        this._data = null;
        this._loading = false;
        this._groups = [];
        this._models = [];
        this._file = null;
        this._errors = [];
        this._validated = false;
        this._selected = new Map();
    }

    private addModel(item: Pick<ImportModelData, "id" | "name" | "related">): void {
        if (this.isModelSelected(item)) {
            return;
        }
        this._selected = createSelected({
            previous: this._selected,
            models: this._models,
            item
        });
    }

    private removeModel(item: Pick<ImportModelData, "id" | "name" | "related">): void {
        if (this.isModelRelated(item)) {
            return;
        }
        const selected = new Map(this._selected);
        selected.delete(item.id);
        this._selected = selected;
    }

    private getDataToImport(): DataToImportResult {
        const selected = Array.from(this._selected.keys());
        const groups: Map<string, ImportStructureVariablesGroup> = new Map();
        const models: Map<string, ImportStructureVariablesModel> = new Map();
        const noAction = [ImportAction.CODE, ImportAction.NONE];

        for (const id of selected) {
            const validatedModel = this._models.find(model => model.id === id);
            if (
                !validatedModel?.action ||
                validatedModel.error ||
                noAction.includes(validatedModel.action)
            ) {
                continue;
            }
            const validatedGroup = this._groups.find(group => group.slug === validatedModel.group);
            if (!validatedGroup?.action || validatedGroup.error) {
                continue;
            }

            const model = this._data?.models?.find(model => model.modelId === id);
            if (!model) {
                continue;
            }
            models.set(id, {
                ...model,
                layout: model.layout || [],
                titleFieldId: model.titleFieldId || "id",
                descriptionFieldId: model.descriptionFieldId || "",
                imageFieldId: model.imageFieldId || "",
                group: validatedModel.group
            });

            if (noAction.includes(validatedGroup.action)) {
                continue;
            }

            const group = this._data?.groups?.find(group => group.slug === validatedModel.group);
            if (!group) {
                continue;
            }
            groups.set(group.id, group);
        }

        return {
            groups: Array.from(groups.values()),
            models: Array.from(models.values())
        };
    }

    private parseFileContent(content?: string | ArrayBuffer | null): Data {
        if (!content) {
            throw new Error("Missing data in uploaded file.");
        }
        const raw =
            content instanceof ArrayBuffer ? Buffer.from(content).toString("utf8") : content;

        let data: Record<string, any> = {};
        try {
            data = JSON.parse(raw);
        } catch {
            throw new Error("Could not parse the uploaded file. Make sure it's a valid JSON file.");
        }
        if (!data.groups?.length && !data.models?.length) {
            throw new Error("No groups and models in the uploaded file.");
        } else if (data.groups.length === 0) {
            throw new Error("No groups in the uploaded file. There must be at least one group.");
        }
        return {
            groups: data.groups,
            models: data.models
        };
    }
}

export const ImportContentModelsPresenter = Abstraction.createImplementation({
    implementation: ImportContentModelsPresenterImpl,
    dependencies: [ValidateImportUseCase, ImportModelsUseCase]
});
