import { computed, makeAutoObservable } from "mobx";
import { ListPresenter } from "@webiny/app-admin/presentation/listPresenter/abstractions.js";
import { ListEntriesUseCase } from "~/features/contentEntry/listEntries/abstractions.js";
import { GetModelUseCase } from "~/features/model/getModel/abstractions.js";
import type { CmsReferenceEntry, CmsReferenceValue } from "~/features/contentEntry/refTypes.js";
import { parseIdentifier } from "@webiny/utils";
import {
    RefDialogPresenter as Abstraction,
    type IRefDialogPresenterInitConfig,
    type IRefDialogViewModel
} from "./abstractions.js";
import { RefDialogSingleModelDataSource } from "./RefDialogSingleModelDataSource.js";

class RefDialogPresenterImpl implements Abstraction.Interface {
    private selectedValues: CmsReferenceValue[] = [];
    private multiple = false;

    constructor(
        private listPresenter: ListPresenter.Interface<CmsReferenceEntry>,
        private listEntriesUseCase: ListEntriesUseCase.Interface,
        private getModelUseCase: GetModelUseCase.Interface
    ) {
        makeAutoObservable<RefDialogPresenterImpl, "listEntriesUseCase" | "getModelUseCase">(this, {
            listEntriesUseCase: false,
            getModelUseCase: false,
            vm: computed
        });
    }

    get list(): ListPresenter.Interface<CmsReferenceEntry> {
        return this.listPresenter;
    }

    get vm(): IRefDialogViewModel {
        return {
            selectedValues: this.selectedValues,
            multiple: this.multiple
        };
    }

    async init(config: IRefDialogPresenterInitConfig): Promise<void> {
        this.multiple = config.multiple;
        this.selectedValues = config.initialValues ? [...config.initialValues] : [];

        const model = await this.getModelUseCase.execute({ modelId: config.modelId });
        const dataSource = new RefDialogSingleModelDataSource(model, this.listEntriesUseCase);

        this.listPresenter.init({
            dataSource,
            initialSort: { field: "savedOn", direction: "DESC" },
            limit: 10
        });
    }

    toggleEntry(ref: CmsReferenceValue): void {
        const { id: refEntryId } = parseIdentifier(ref.id);

        if (!this.multiple) {
            const [current] = this.selectedValues;
            if (current) {
                const { id: currentEntryId } = parseIdentifier(current.id);
                if (currentEntryId === refEntryId) {
                    this.selectedValues = [];
                    return;
                }
            }
            this.selectedValues = [ref];
            return;
        }

        const index = this.selectedValues.findIndex(v => {
            const { id: vEntryId } = parseIdentifier(v.id);
            return vEntryId === refEntryId;
        });

        if (index >= 0) {
            this.selectedValues = [
                ...this.selectedValues.slice(0, index),
                ...this.selectedValues.slice(index + 1)
            ];
        } else {
            this.selectedValues = [...this.selectedValues, ref];
        }
    }

    save(): CmsReferenceValue[] {
        return this.selectedValues;
    }

    dispose(): void {
        // Cleanup if needed
    }
}

export const RefDialogPresenter = Abstraction.createImplementation({
    implementation: RefDialogPresenterImpl,
    dependencies: [ListPresenter, ListEntriesUseCase, GetModelUseCase]
});
