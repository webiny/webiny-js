import { computed, makeAutoObservable, runInAction } from "mobx";
import type { IFormModel } from "@webiny/app-admin/features/formModel/abstractions.js";
import { FormModelFactory } from "@webiny/app-admin/features/formModel/abstractions.js";
import type { CmsContentEntry } from "~/types.js";
import { GetSingletonEntryUseCase } from "~/features/contentEntry/singletonEntry/abstractions.js";
import { UpdateSingletonEntryUseCase } from "~/features/contentEntry/singletonEntry/abstractions.js";
import { CmsFormModelBuilder } from "~/features/formModel/abstractions.js";
import { CmsModelContext } from "~/features/contentEntry/abstractions.js";
import {
    SingleEntryPresenter as Abstraction,
    type ISingleEntryPresenter,
    type ISingleEntryViewModel
} from "./abstractions.js";

class SingleEntryPresenterImpl implements ISingleEntryPresenter {
    private entry: CmsContentEntry | null = null;
    private form: IFormModel | null = null;
    private loading: string | null = null;

    constructor(
        private formModelFactory: FormModelFactory.Interface,
        private cmsFormModelBuilder: CmsFormModelBuilder.Interface,
        private modelAccessor: CmsModelContext.Interface,
        private getSingletonEntryUseCase: GetSingletonEntryUseCase.Interface,
        private updateSingletonEntryUseCase: UpdateSingletonEntryUseCase.Interface
    ) {
        makeAutoObservable<
            SingleEntryPresenterImpl,
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

    get vm(): ISingleEntryViewModel {
        return {
            loading: this.loading,
            entry: this.entry,
            form: this.form?.vm ?? null,
            canSave: this.form !== null,
            isDirty: this.form?.isDirty ?? false
        };
    }

    async save(): Promise<boolean> {
        if (!this.form) {
            return false;
        }

        const data = await this.form.submit();
        if (!data) {
            return false;
        }

        this.loading = "Saving...";

        try {
            const entry = await this.updateSingletonEntryUseCase.execute({
                model: this.model,
                data: {
                    values: data
                }
            });

            runInAction(() => {
                this.entry = entry;
                this.form!.setData(entry.values);
                this.form!.reset();
            });

            return true;
        } catch {
            return false;
        } finally {
            runInAction(() => {
                this.loading = null;
            });
        }
    }

    async init(): Promise<void> {
        this.loading = "Loading...";

        try {
            const entry = await this.getSingletonEntryUseCase.execute({
                model: this.model
            });

            runInAction(() => {
                this.entry = entry;
                const formConfig = this.cmsFormModelBuilder.build(this.model);
                this.form = this.formModelFactory.create(formConfig);
                this.form.setData(entry.values);
                this.form.reset();
            });
        } finally {
            runInAction(() => {
                this.loading = null;
            });
        }
    }

    dispose(): void {
        this.form = null;
        this.entry = null;
    }
}

export const SingleEntryPresenter = Abstraction.createImplementation({
    implementation: SingleEntryPresenterImpl,
    dependencies: [
        FormModelFactory,
        CmsFormModelBuilder,
        CmsModelContext,
        GetSingletonEntryUseCase,
        UpdateSingletonEntryUseCase
    ]
});
