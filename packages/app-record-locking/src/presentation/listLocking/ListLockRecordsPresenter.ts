import { computed, makeAutoObservable, observable, runInAction } from "mobx";
import { ListLockRecordsUseCase } from "~/features/listLockRecords/abstractions.js";
import {
    ListLockRecordsPresenter as Abstraction,
    type IListLockRecordsPresenter,
    type IListLockRecordsViewModel
} from "./abstractions.js";
import type { IRecordLockingLockRecord } from "~/types.js";

class ListLockRecordsPresenterImpl implements IListLockRecordsPresenter {
    private _lockMap = observable.map<string, IRecordLockingLockRecord>();

    constructor(private listLockRecordsUseCase: ListLockRecordsUseCase.Interface) {
        makeAutoObservable<ListLockRecordsPresenterImpl, "listLockRecordsUseCase">(this, {
            listLockRecordsUseCase: false,
            vm: computed
        });
    }

    get vm(): IListLockRecordsViewModel {
        return {
            lockedCount: this._lockMap.size
        };
    }

    async fetchForEntries(entryIds: string[], type: string): Promise<void> {
        if (entryIds.length === 0) {
            return;
        }

        try {
            const records = await this.listLockRecordsUseCase.execute({
                where: { id_in: entryIds, type },
                limit: entryIds.length
            });

            runInAction(() => {
                this._lockMap.clear();
                for (const record of records) {
                    this._lockMap.set(record.targetId, record);
                }
            });
        } catch {
            // Silently fail — list still works without lock indicators
        }
    }

    isLocked(entryId: string): boolean {
        return this._lockMap.has(entryId);
    }

    getLockRecord(entryId: string): IRecordLockingLockRecord | undefined {
        return this._lockMap.get(entryId);
    }

    dispose(): void {
        this._lockMap.clear();
    }
}

export const ListLockRecordsPresenterImplementation = Abstraction.createImplementation({
    implementation: ListLockRecordsPresenterImpl,
    dependencies: [ListLockRecordsUseCase]
});
