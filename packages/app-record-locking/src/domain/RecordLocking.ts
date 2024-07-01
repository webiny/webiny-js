import { IRecordLocking, IRecordLockingUpdateEntryLockResult } from "./abstractions/IRecordLocking";
import { ApolloClient } from "apollo-client";
import { RecordLockingGetLockRecord } from "./RecordLockingGetLockRecord";
import { RecordLockingIsEntryLocked } from "./RecordLockingIsEntryLocked";
import { RecordLockingListLockRecords } from "./RecordLockingListLockRecords";
import { RecordLockingLockEntry } from "./RecordLockingLockEntry";
import { RecordLockingUnlockEntry } from "./RecordLockingUnlockEntry";
import { RecordLockingUnlockEntryRequest } from "./RecordLockingUnlockEntryRequest";
import { RecordLockingClient } from "./RecordLockingClient";
import { IRecordLockingGetLockRecord } from "./abstractions/IRecordLockingGetLockRecord";
import { IRecordLockingIsEntryLocked } from "./abstractions/IRecordLockingIsEntryLocked";
import {
    IRecordLockingListLockRecords,
    IRecordLockingListLockRecordsResult
} from "./abstractions/IRecordLockingListLockRecords";
import { IRecordLockingLockEntry } from "./abstractions/IRecordLockingLockEntry";
import {
    IRecordLockingUnlockEntry,
    IRecordLockingUnlockEntryResult
} from "./abstractions/IRecordLockingUnlockEntry";
import { IRecordLockingUnlockEntryRequest } from "./abstractions/IRecordLockingUnlockEntryRequest";
import {
    IFetchLockedEntryLockRecordParams,
    IFetchLockRecordParams,
    IFetchLockRecordResult,
    IIsRecordLockedParams,
    IRecordLockingError,
    IRecordLockingLockRecord,
    IRecordLockingRecord,
    IPossiblyRecordLockingRecord,
    IUnlockEntryParams,
    IUpdateEntryLockParams
} from "~/types";
import { IRecordLockingClient } from "./abstractions/IRecordLockingClient";
import { createRecordLockingError } from "./utils/createRecordLockingError";
import { parseIdentifier } from "@webiny/utils/parseIdentifier";
import { createCacheKey } from "~/utils/createCacheKey";
import { RecordLockingUpdateEntryLock } from "~/domain/RecordLockingUpdateEntryLock";
import { IRecordLockingUpdateEntryLock } from "~/domain/abstractions/IRecordLockingUpdateEntryLock";
import { RecordLockingGetLockedEntryLockRecord } from "~/domain/RecordLockingGetLockedEntryLockRecord";
import { IRecordLockingGetLockedEntryLockRecord } from "./abstractions/IRecordLockingGetLockedEntryLockRecord";

export interface ICreateRecordLockingParams {
    client: ApolloClient<any>;
    setLoading: (loading: boolean) => void;
}

export interface IRecordLockingParams {
    client: IRecordLockingClient;
    setLoading: (loading: boolean) => void;
    getLockRecord: IRecordLockingGetLockRecord;
    getLockedEntryLockRecord: IRecordLockingGetLockedEntryLockRecord;
    isEntryLocked: IRecordLockingIsEntryLocked;
    listLockRecords: IRecordLockingListLockRecords;
    lockEntry: IRecordLockingLockEntry;
    unlockEntry: IRecordLockingUnlockEntry;
    unlockEntryRequest: IRecordLockingUnlockEntryRequest;
    updateEntryLock: IRecordLockingUpdateEntryLock;
}

export interface IOnErrorCb {
    (error: IRecordLockingError): void;
}

class RecordLocking<T extends IPossiblyRecordLockingRecord = IPossiblyRecordLockingRecord>
    implements IRecordLocking<T>
{
    private currentRecordType?: string;
    private currentFolderId?: string;
    private currentRecordsCacheKey?: string;
    private readonly _setLoading: (loading: boolean) => void;
    public loading = false;
    public records: IRecordLockingRecord[] = [];

    private readonly client: IRecordLockingClient;
    private readonly _getLockRecord: IRecordLockingGetLockRecord;
    private readonly _isEntryLocked: IRecordLockingIsEntryLocked;
    private readonly _getLockedEntryLockRecord: IRecordLockingGetLockedEntryLockRecord;
    private readonly _listLockRecords: IRecordLockingListLockRecords;
    private readonly _lockEntry: IRecordLockingLockEntry;
    private readonly _unlockEntry: IRecordLockingUnlockEntry;
    private readonly _unlockEntryRequest: IRecordLockingUnlockEntryRequest;
    private readonly _updateEntryLock: IRecordLockingUpdateEntryLock;

    private onErrorCb: IOnErrorCb | null = null;

    public constructor(params: IRecordLockingParams) {
        this.client = params.client;
        this._setLoading = params.setLoading;
        this._getLockRecord = params.getLockRecord;
        this._getLockedEntryLockRecord = params.getLockedEntryLockRecord;
        this._isEntryLocked = params.isEntryLocked;
        this._listLockRecords = params.listLockRecords;
        this._lockEntry = params.lockEntry;
        this._unlockEntry = params.unlockEntry;
        this._unlockEntryRequest = params.unlockEntryRequest;
        this._updateEntryLock = params.updateEntryLock;
    }

    public async setRecords(
        folderId: string,
        type: string,
        records: T[]
    ): Promise<IRecordLockingRecord[] | undefined> {
        const result = await this.fetchAndAssignRecords(folderId, type, records);
        if (!result) {
            return undefined;
        }

        return result.map(record => {
            const { id: entryId } = parseIdentifier(record.id);
            return {
                ...record,
                $lockingType: type,
                $locked: record.$locked,
                $selectable: record.$locked ? false : record.$selectable,
                entryId
            };
        });
    }

    public async fetchLockRecord(params: IFetchLockRecordParams): Promise<IFetchLockRecordResult> {
        const { id, $lockingType } = params;

        const { id: entryId } = parseIdentifier(id);

        try {
            const result = await this._getLockRecord.execute({
                id: entryId,
                type: $lockingType
            });

            return {
                data: result.data,
                error: result.error
            };
        } catch (ex) {
            return {
                data: null,
                error: ex
            };
        }
    }

    public async fetchLockedEntryLockRecord(
        params: IFetchLockedEntryLockRecordParams
    ): Promise<IRecordLockingLockRecord | null> {
        const { id, $lockingType } = params;

        const { id: entryId } = parseIdentifier(id);
        const result = await this._getLockedEntryLockRecord.execute({
            id: entryId,
            type: $lockingType
        });
        return result.data;
    }

    public getLockRecordEntry(id: string): IRecordLockingRecord | undefined {
        return this.records.find(record => {
            const { id: entryId } = parseIdentifier(id);
            return record.entryId === entryId;
        });
    }

    public isRecordLocked(record: IIsRecordLockedParams): boolean {
        const result = this.records.find(r => {
            const { id: entryId } = parseIdentifier(record.id);

            return r.entryId === entryId && !!r.$locked && r.$lockingType === record.$lockingType;
        });
        if (!result?.$locked?.expiresOn) {
            return false;
        }
        const isExpired = this.isLockExpired(result.$locked.expiresOn);
        return !isExpired;
    }

    public async updateEntryLock(
        params: IUpdateEntryLockParams
    ): Promise<IRecordLockingUpdateEntryLockResult> {
        try {
            return await this._updateEntryLock.execute({
                id: params.id,
                type: params.$lockingType
            });
        } catch (ex) {
            this.triggerOnError(ex);
            return {
                data: null,
                error: ex
            };
        }
    }

    public removeEntryLock(params: IUnlockEntryParams): void {
        const index = this.records.findIndex(record => {
            return record.entryId === params.id && record.$lockingType === params.$lockingType;
        });
        if (index === -1) {
            return;
        }
        this.records[index] = {
            ...this.records[index],
            $locked: null,
            $selectable: true
        };
    }

    public async unlockEntry(
        params: IUnlockEntryParams,
        force?: boolean
    ): Promise<IRecordLockingUnlockEntryResult> {
        try {
            const result = await this._unlockEntry.execute({
                id: params.id,
                type: params.$lockingType,
                force
            });

            const id = result.data?.id;
            if (!id) {
                return result;
            }
            const index = this.records.findIndex(r => r.entryId === id);
            if (index === -1) {
                return result;
            }

            this.records[index] = {
                ...this.records[index],
                $locked: undefined,
                $selectable: true
            };

            return result;
        } catch (ex) {
            this.triggerOnError(ex);
            return {
                data: null,
                error: ex
            };
        }
    }

    public onError(cb: IOnErrorCb): void {
        this.onErrorCb = cb;
    }

    public triggerOnError(error: IRecordLockingError): void {
        this.setIsLoading(false);
        if (!this.onErrorCb) {
            return;
        }
        this.onErrorCb(error);
    }

    public isLockExpired(input: Date | string): boolean {
        const expiresOn = new Date(input);
        return expiresOn <= new Date();
    }

    private setIsLoading(loading: boolean): void {
        this._setLoading(loading);
        this.loading = loading;
    }

    private async fetchAndAssignRecords(
        folderId: string,
        type: string,
        records: T[]
    ): Promise<IPossiblyRecordLockingRecord[] | undefined> {
        if (records.length === 0) {
            return;
        } else if (this.loading) {
            return;
        }
        const assignedIdList = await this.assignRecords(folderId, type, records);
        if (assignedIdList.length === 0) {
            return;
        }
        this.setIsLoading(true);
        let result: IRecordLockingListLockRecordsResult;
        try {
            result = await this._listLockRecords.execute({
                where: {
                    id_in: assignedIdList,
                    type
                },
                limit: 10000
            });
        } catch (ex) {
            console.error(ex);
            this.triggerOnError(ex);
            return;
        } finally {
            this.setIsLoading(false);
        }
        if (result.error) {
            this.triggerOnError(result.error);
            return;
        } else if (!result.data) {
            this.triggerOnError(
                createRecordLockingError({
                    message: `There is no data in the result and there is no error. Please check the network tab for more info.`,
                    code: "NO_DATA_IN_RESULT"
                })
            );
            return;
        } else if (result.data.length === 0) {
            return;
        }

        for (const record of result.data) {
            const index = this.records.findIndex(r => {
                const { id: entryId } = parseIdentifier(record.id);
                return r.entryId === entryId;
            });
            if (index < 0) {
                console.error(`There is no record with id ${record.id} in the records array.`);
                continue;
            }
            this.records[index] = {
                ...this.records[index],
                $locked: {
                    lockedBy: record.lockedBy,
                    expiresOn: record.expiresOn,
                    lockedOn: record.lockedOn,
                    actions: record.actions
                }
            };
        }

        return this.records;
    }
    /**
     * Assign records and return the assigned ID list.
     */
    private async assignRecords(folderId: string, type: string, records: T[]): Promise<string[]> {
        /**
         * First we check the record keys against ones in the local cache.
         */
        const keys = records.map(record => {
            if (record.entryId) {
                return record.entryId;
            }
            const { id: entryId } = parseIdentifier(record.id);
            return entryId;
        });
        const cacheKey = await createCacheKey(keys);
        if (this.currentRecordsCacheKey === cacheKey) {
            return [];
        }
        this.currentRecordsCacheKey = cacheKey;

        /**
         * Reset records if new type is not as same as the old type / folderId.
         */
        if (this.currentRecordType !== type || this.currentFolderId !== folderId) {
            this.records = [];
            this.currentRecordType = type;
            this.currentFolderId = folderId;
        }

        return records.reduce<string[]>((collection, record) => {
            const { id: entryId } = parseIdentifier(record.id);
            const index = this.records.findIndex(r => r.entryId === entryId);
            if (index >= 0) {
                return collection;
            }
            this.records.push({
                ...record,
                entryId,
                $lockingType: type,
                $locked: undefined
            });
            if (record.$type !== "RECORD") {
                return collection;
            }
            collection.push(entryId);
            return collection;
        }, []);
    }
}

export const createRecordLocking = <T extends IRecordLockingRecord>(
    config: ICreateRecordLockingParams
): IRecordLocking => {
    const client = new RecordLockingClient({
        client: config.client
    });

    const getLockRecord = new RecordLockingGetLockRecord({
        client
    });

    const getLockedEntryLockRecord = new RecordLockingGetLockedEntryLockRecord({
        client
    });

    const isEntryLocked = new RecordLockingIsEntryLocked({
        client
    });

    const listLockRecords = new RecordLockingListLockRecords({
        client
    });

    const lockEntry = new RecordLockingLockEntry({
        client
    });

    const unlockEntry = new RecordLockingUnlockEntry({
        client
    });
    const unlockEntryRequest = new RecordLockingUnlockEntryRequest({
        client
    });

    const updateEntryLock = new RecordLockingUpdateEntryLock({
        client
    });

    return new RecordLocking<T>({
        client,
        setLoading: config.setLoading,
        getLockRecord,
        getLockedEntryLockRecord,
        isEntryLocked,
        listLockRecords,
        updateEntryLock,
        lockEntry,
        unlockEntry,
        unlockEntryRequest
    });
};
