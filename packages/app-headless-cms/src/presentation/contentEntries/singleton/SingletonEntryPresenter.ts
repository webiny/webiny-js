import { computed, makeAutoObservable, runInAction } from "mobx";
import type { IFormModel } from "@webiny/app-admin/features/formModel/abstractions.js";
import { FormModelFactory } from "@webiny/app-admin/features/formModel/abstractions.js";
import type { CmsContentEntry } from "~/types.js";
import { GetSingletonEntryUseCase } from "~/features/contentEntry/singletonEntry/abstractions.js";
import { UpdateSingletonEntryUseCase } from "~/features/contentEntry/singletonEntry/abstractions.js";
import { CmsFormModelBuilder } from "~/features/formModel/abstractions.js";
import { CmsModelAccessor } from "~/features/contentEntry/abstractions.js";
import {
    SingletonEntryPresenter as Abstraction,
    type ISingletonEntryPresenter,
    type ISingletonEntryViewModel
} from "./abstractions.js";

class SingletonEntryPresenterImpl implements ISingletonEntryPresenter {
    private _entry: CmsContentEntry | null = null;
    private _form: IFormModel | null = null;
    private _loading: string | null = null;

    constructor(
        private formModelFactory: FormModelFactory.Interface,
        private cmsFormModelBuilder: CmsFormModelBuilder.Interface,
        private modelAccessor: CmsModelAccessor.Interface,
        private getSingletonEntryUseCase: GetSingletonEntryUseCase.Interface,
        private updateSingletonEntryUseCase: UpdateSingletonEntryUseCase.Interface
    ) {
        makeAutoObservable<
            SingletonEntryPresenterImpl,
            | "formModelFactory"
            | "cmsFormModelBuilder"
            | "modelAccessor"
            | "getSingletonEntryUseCase"
            | "updateSingletonEntryUseCase"
        >(this, {
            formModelFactory: false,
            cmsFormModelBuilder: false,
            modelAccessor: false,
            getSingletonEntryUseCase: false,
            updateSingletonEntryUseCase: false,
            vm: computed
        });
    }

    private get model() {
        return this.modelAccessor.getModel();
    }

    get vm(): ISingletonEntryViewModel {
        return {
            loading: this._loading,
            entry: this._entry,
            form: this._form?.vm ?? null,
            canSave: this._form !== null,
            isDirty: this._form?.isDirty ?? false
        };
    }

    async save(): Promise<boolean> {
        if (!this._form) {
            return false;
        }

        const data = await this._form.submit();
        if (!data) {
            return false;
        }

        this._loading = "Saving...";

        try {
            const entry = await this.updateSingletonEntryUseCase.execute({
                model: this.model,
                data: data as Record<string, unknown>
            });

            runInAction(() => {
                this._entry = entry;
                this._form!.setData(entry.values);
                this._form!.reset();
            });

            return true;
        } catch {
            return false;
        } finally {
            runInAction(() => {
                this._loading = null;
            });
        }
    }

    async init(): Promise<void> {
        this._loading = "Loading...";

        try {
            const entry = await this.getSingletonEntryUseCase.execute({
                model: this.model
            });

            runInAction(() => {
                this._entry = entry;
                const formConfig = this.cmsFormModelBuilder.build(this.model);
                this._form = this.formModelFactory.create(formConfig);
                this._form.setData(entry.values);
                this._form.reset();
            });
        } finally {
            runInAction(() => {
                this._loading = null;
            });
        }
    }

    dispose(): void {
        this._form = null;
        this._entry = null;
    }
}

export const SingletonEntryPresenterImplementation = Abstraction.createImplementation({
    implementation: SingletonEntryPresenterImpl,
    dependencies: [
        FormModelFactory,
        CmsFormModelBuilder,
        CmsModelAccessor,
        GetSingletonEntryUseCase,
        UpdateSingletonEntryUseCase
    ]
});
