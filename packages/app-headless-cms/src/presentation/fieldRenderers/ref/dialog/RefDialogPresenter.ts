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
    private _selectedValues: CmsReferenceValue[] = [];
    private _multiple = false;

    constructor(
        private _listPresenter: ListPresenter.Interface<CmsReferenceEntry>,
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
        return this._listPresenter;
    }

    get vm(): IRefDialogViewModel {
        return {
            selectedValues: this._selectedValues,
            multiple: this._multiple
        };
    }

    async init(config: IRefDialogPresenterInitConfig): Promise<void> {
        this._multiple = config.multiple;
        this._selectedValues = config.initialValues ? [...config.initialValues] : [];

        const model = await this.getModelUseCase.execute({ modelId: config.modelId });
        const dataSource = new RefDialogSingleModelDataSource(model, this.listEntriesUseCase);

        this._listPresenter.init({
            dataSource,
            initialSort: { field: "savedOn", direction: "DESC" },
            limit: 10
        });
    }

    toggleEntry(ref: CmsReferenceValue): void {
        const { id: refEntryId } = parseIdentifier(ref.id);

        if (!this._multiple) {
            const [current] = this._selectedValues;
            if (current) {
                const { id: currentEntryId } = parseIdentifier(current.id);
                if (currentEntryId === refEntryId) {
                    this._selectedValues = [];
                    return;
                }
            }
            this._selectedValues = [ref];
            return;
        }

        const index = this._selectedValues.findIndex(v => {
            const { id: vEntryId } = parseIdentifier(v.id);
            return vEntryId === refEntryId;
        });

        if (index >= 0) {
            this._selectedValues = [
                ...this._selectedValues.slice(0, index),
                ...this._selectedValues.slice(index + 1)
            ];
        } else {
            this._selectedValues = [...this._selectedValues, ref];
        }
    }

    save(): CmsReferenceValue[] {
        return this._selectedValues;
    }

    dispose(): void {
        // Cleanup if needed
    }
}

export const RefDialogPresenterImplementation = Abstraction.createImplementation({
    implementation: RefDialogPresenterImpl,
    dependencies: [ListPresenter, ListEntriesUseCase, GetModelUseCase]
});
