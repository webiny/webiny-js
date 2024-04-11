import { ILockingMechanism } from "./abstractions/ILockingMechanism";
import { ApolloClient } from "apollo-client";
import { LockingMechanismGetLockRecord } from "./LockingMechanismGetLockRecord";
import { LockingMechanismIsEntryLocked } from "./LockingMechanismIsEntryLocked";
import { LockingMechanismListLockRecords } from "./LockingMechanismListLockRecords";
import { LockingMechanismLockEntry } from "./LockingMechanismLockEntry";
import { LockingMechanismUnlockEntry } from "./LockingMechanismUnlockEntry";
import { LockingMechanismUnlockEntryRequest } from "./LockingMechanismUnlockEntryRequest";
import { LockingMechanismClient } from "./LockingMechanismClient";
import { ILockingMechanismGetLockRecord } from "./abstractions/ILockingMechanismGetLockRecord";
import { ILockingMechanismIsEntryLocked } from "./abstractions/ILockingMechanismIsEntryLocked";
import {
    ILockingMechanismListLockRecords,
    ILockingMechanismListLockRecordsResult
} from "./abstractions/ILockingMechanismListLockRecords";
import { ILockingMechanismLockEntry } from "./abstractions/ILockingMechanismLockEntry";
import { ILockingMechanismUnlockEntry } from "./abstractions/ILockingMechanismUnlockEntry";
import { ILockingMechanismUnlockEntryRequest } from "./abstractions/ILockingMechanismUnlockEntryRequest";
import {
    IIsRecordLockedParams,
    ILockingMechanismError,
    ILockingMechanismRecord,
    IPossiblyLockingMechanismRecord
} from "~/types";
import { ILockingMechanismClient } from "./abstractions/ILockingMechanismClient";
import { createLockingMechanismError } from "./utils/createLockingMechanismError";
import { parseIdentifier } from "@webiny/utils/parseIdentifier";
import { createCacheKey } from "~/utils/createCacheKey";

export interface ICreateLockingMechanismParams {
    client: ApolloClient<any>;
}

export interface ILockingMechanismParams {
    client: ILockingMechanismClient;
    getLockRecord: ILockingMechanismGetLockRecord;
    isEntryLocked: ILockingMechanismIsEntryLocked;
    listLockRecords: ILockingMechanismListLockRecords;
    lockEntry: ILockingMechanismLockEntry;
    unlockEntry: ILockingMechanismUnlockEntry;
    unlockEntryRequest: ILockingMechanismUnlockEntryRequest;
}

export interface IOnErrorCb {
    (error: ILockingMechanismError): void;
}

class LockingMechanism<T extends IPossiblyLockingMechanismRecord = IPossiblyLockingMechanismRecord>
    implements ILockingMechanism<T>
{
    private currentRecordType?: string;
    private currentFolderId?: string;
    private currentRecordsCacheKey?: string;
    public loading = false;
    public records: ILockingMechanismRecord[] = [];

    private readonly client: ILockingMechanismClient;
    private readonly getLockRecord: ILockingMechanismGetLockRecord;
    private readonly isEntryLocked: ILockingMechanismIsEntryLocked;
    private readonly listLockRecords: ILockingMechanismListLockRecords;
    private readonly lockEntry: ILockingMechanismLockEntry;
    private readonly unlockEntry: ILockingMechanismUnlockEntry;
    private readonly unlockEntryRequest: ILockingMechanismUnlockEntryRequest;

    private onErrorCb: IOnErrorCb | null = null;

    public constructor(params: ILockingMechanismParams) {
        this.client = params.client;
        this.getLockRecord = params.getLockRecord;
        this.isEntryLocked = params.isEntryLocked;
        this.listLockRecords = params.listLockRecords;
        this.lockEntry = params.lockEntry;
        this.unlockEntry = params.unlockEntry;
        this.unlockEntryRequest = params.unlockEntryRequest;
    }

    public async setRecords(
        folderId: string,
        type: string,
        records: T[]
    ): Promise<ILockingMechanismRecord[] | undefined> {
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
                entryId
            };
        });
    }

    public getLockRecordEntry(id: string): ILockingMechanismRecord | undefined {
        return this.records.find(record => {
            const { id: entryId } = parseIdentifier(id);
            return record.entryId === entryId && !!record.$locked;
        });
    }

    public isRecordLocked(record: IIsRecordLockedParams): boolean {
        return this.records.some(r => {
            const { id: entryId } = parseIdentifier(record.id);
            console.log("r", r);
            console.log("record", record);
            return r.entryId === entryId && !!r.$locked && r.$lockingType === record.$lockingType;
        });
    }

    public onError(cb: IOnErrorCb): void {
        this.onErrorCb = cb;
    }

    public triggerOnError(error: ILockingMechanismError): void {
        this.setIsLoading(false);
        if (!this.onErrorCb) {
            return;
        }
        this.onErrorCb(error);
    }

    private setIsLoading(loading: boolean): void {
        this.loading = loading;
    }

    private async fetchAndAssignRecords(
        folderId: string,
        type: string,
        records: T[]
    ): Promise<IPossiblyLockingMechanismRecord[] | undefined> {
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
        let result: ILockingMechanismListLockRecordsResult;
        try {
            result = await this.listLockRecords.execute({
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
                createLockingMechanismError({
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
            collection.push(entryId);
            return collection;
        }, []);
    }
}

export const createLockingMechanism = <T extends ILockingMechanismRecord>(
    config: ICreateLockingMechanismParams
): ILockingMechanism => {
    const client = new LockingMechanismClient({
        client: config.client
    });

    const getLockRecord = new LockingMechanismGetLockRecord({
        client
    });

    const isEntryLocked = new LockingMechanismIsEntryLocked({
        client
    });

    const listLockRecords = new LockingMechanismListLockRecords({
        client
    });

    const lockEntry = new LockingMechanismLockEntry({
        client
    });

    const unlockEntry = new LockingMechanismUnlockEntry({
        client
    });
    const unlockEntryRequest = new LockingMechanismUnlockEntryRequest({
        client
    });

    return new LockingMechanism<T>({
        client,
        getLockRecord,
        isEntryLocked,
        listLockRecords,
        lockEntry,
        unlockEntry,
        unlockEntryRequest
    });
};
