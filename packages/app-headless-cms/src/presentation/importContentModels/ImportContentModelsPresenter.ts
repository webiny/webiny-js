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
    private data: Data | null = null;
    private loading = false;
    private groups: ImportGroupData[] = [];
    private models: ImportModelData[] = [];
    private file: File | null = null;
    private errors: string[] = [];
    private validated = false;
    private selected: Selected = new Map();

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
            data: this.data,
            loading: this.loading,
            groups: this.groups,
            models: this.models,
            file: this.file,
            errors: this.errors,
            validated: this.validated
        };
    }

    hasSelected(): boolean {
        return this.selected.size > 0;
    }

    isModelSelected(item: Pick<ImportModelData, "id">): boolean {
        return this.selected.has(item.id);
    }

    isModelRelated({ id: target }: Pick<ImportModelData, "id">): boolean {
        for (const id of this.selected.keys()) {
            if (id === target) {
                continue;
            }
            const related = this.selected.get(id);
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
                    this.models = [];
                    this.groups = [];
                    this.selected = new Map();
                    this.errors = [];
                    this.validated = false;
                    this.file = file;
                    this.data = data;
                });
            } catch (ex: any) {
                runInAction(() => {
                    this.file = file;
                    this.selected = new Map();
                    this.validated = false;
                    this.groups = [];
                    this.models = [];
                    this.data = null;
                    this.errors = [ex.message];
                });
            }
        });
        reader.readAsText(file);
    }

    onFileError(error: string): void {
        this.file = null;
        this.errors = [error];
    }

    toggleModel(item: Pick<ImportModelData, "id" | "name" | "related">): void {
        if (this.isModelSelected(item)) {
            this.removeModel(item);
        } else {
            this.addModel(item);
        }
    }

    async handleModelsValidation(): Promise<void> {
        if (!this.data) {
            return;
        }

        this.loading = true;

        try {
            const data = await this.validateUseCase.execute(this.data as any);

            runInAction(() => {
                this.loading = false;
                this.groups = data.groups.map(group => ({
                    id: group.group.id,
                    name: group.group.name,
                    slug: group.group.slug,
                    error: group.error,
                    action: group.action
                }));
                this.models = data.models.map(model => ({
                    id: model.model.modelId,
                    name: model.model.name,
                    group: model.model.group,
                    related: model.related || [],
                    error: model.error,
                    action: model.action
                }));
                this.validated = true;
            });
        } catch (ex: any) {
            runInAction(() => {
                this.loading = false;
                this.errors = [ex.message];
            });
        }
    }

    async handleModelsImport(): Promise<void> {
        if (!this.data || !this.groups.length || !this.models.length || !this.selected.size) {
            return;
        }

        this.loading = true;

        const dataToImport = this.getDataToImport();

        try {
            const data = await this.importUseCase.execute(dataToImport);

            runInAction(() => {
                this.loading = false;
                this.selected = new Map();
                this.groups = this.groups.map(group => {
                    const result = data.groups.find(item => item.group.id === group.id);
                    return {
                        id: result?.group.id || group.id,
                        name: result?.group.name || group.name,
                        slug: result?.group.slug || group.slug,
                        error: result?.error || group.error,
                        imported: result ? result.imported : group.imported
                    };
                });
                this.models = this.models.map(model => {
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
                this.validated = true;
            });
        } catch (ex: any) {
            runInAction(() => {
                this.loading = false;
                this.errors = [ex.message];
            });
        }
    }

    reset(): void {
        this.data = null;
        this.loading = false;
        this.groups = [];
        this.models = [];
        this.file = null;
        this.errors = [];
        this.validated = false;
        this.selected = new Map();
    }

    private addModel(item: Pick<ImportModelData, "id" | "name" | "related">): void {
        if (this.isModelSelected(item)) {
            return;
        }
        this.selected = createSelected({
            previous: this.selected,
            models: this.models,
            item
        });
    }

    private removeModel(item: Pick<ImportModelData, "id" | "name" | "related">): void {
        if (this.isModelRelated(item)) {
            return;
        }
        const selected = new Map(this.selected);
        selected.delete(item.id);
        this.selected = selected;
    }

    private getDataToImport(): DataToImportResult {
        const selected = Array.from(this.selected.keys());
        const groups: Map<string, ImportStructureVariablesGroup> = new Map();
        const models: Map<string, ImportStructureVariablesModel> = new Map();
        const noAction = [ImportAction.CODE, ImportAction.NONE];

        for (const id of selected) {
            const validatedModel = this.models.find(model => model.id === id);
            if (
                !validatedModel?.action ||
                validatedModel.error ||
                noAction.includes(validatedModel.action)
            ) {
                continue;
            }
            const validatedGroup = this.groups.find(group => group.slug === validatedModel.group);
            if (!validatedGroup?.action || validatedGroup.error) {
                continue;
            }

            const model = this.data?.models?.find(model => model.modelId === id);
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

            const group = this.data?.groups?.find(group => group.slug === validatedModel.group);
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
