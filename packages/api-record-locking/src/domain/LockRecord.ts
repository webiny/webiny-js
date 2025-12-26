import type { CmsEntry } from "@webiny/api-headless-cms/types";
import type { CmsIdentity } from "@webiny/api-headless-cms/types";
import { RecordLockingLockRecordActionType } from "./types.js";
import type {
    LockRecordAction,
    LockRecordApprovedAction,
    LockRecordDeniedAction,
    LockRecordEntryType,
    LockRecordObject,
    LockRecordRequestedAction,
    LockRecordValues
} from "./types.js";
import { removeLockRecordDatabasePrefix } from "~/utils/lockRecordDatabaseId.js";
import { calculateExpiresOn } from "./calculateExpiresOn.js";

export interface ILockRecord {
    readonly id: string;
    readonly targetId: string;
    readonly type: LockRecordEntryType;
    readonly lockedBy: CmsIdentity;
    readonly lockedOn: Date;
    readonly updatedOn: Date;
    readonly expiresOn: Date;
    readonly actions?: LockRecordAction[];

    toObject(): LockRecordObject;
    addAction(action: LockRecordAction): void;
    getUnlockRequested(): LockRecordRequestedAction | undefined;
    getUnlockApproved(): LockRecordApprovedAction | undefined;
    getUnlockDenied(): LockRecordDeniedAction | undefined;
    isExpired(): boolean;
}

export type LockRecordParams = Pick<
    CmsEntry<LockRecordValues>,
    "entryId" | "values" | "createdBy" | "createdOn" | "savedOn"
>;

export class LockRecord implements ILockRecord {
    private readonly _id: string;
    private readonly _targetId: string;
    private readonly _type: LockRecordEntryType;
    private readonly _lockedBy: CmsIdentity;
    private readonly _lockedOn: Date;
    private readonly _updatedOn: Date;
    private readonly _expiresOn: Date;
    private _actions?: LockRecordAction[];

    public get id(): string {
        return this._id;
    }

    public get targetId(): string {
        return this._targetId;
    }

    public get type(): LockRecordEntryType {
        return this._type;
    }

    public get lockedBy(): CmsIdentity {
        return this._lockedBy;
    }

    public get lockedOn(): Date {
        return this._lockedOn;
    }

    public get updatedOn(): Date {
        return this._updatedOn;
    }

    public get expiresOn(): Date {
        return this._expiresOn;
    }

    public get actions(): LockRecordAction[] | undefined {
        return this._actions;
    }

    public constructor(input: LockRecordParams, timeout: number) {
        this._id = removeLockRecordDatabasePrefix(input.entryId);
        this._targetId = input.values.targetId;
        this._type = input.values.type;
        this._lockedBy = input.createdBy;
        this._lockedOn = new Date(input.createdOn);
        this._updatedOn = new Date(input.savedOn);
        this._expiresOn = calculateExpiresOn(input.savedOn, timeout);
        this._actions = input.values.actions;
    }

    public toObject(): LockRecordObject {
        return {
            id: this._id,
            targetId: this._targetId,
            type: this._type,
            lockedBy: this._lockedBy,
            lockedOn: this._lockedOn,
            updatedOn: this._updatedOn,
            expiresOn: this._expiresOn,
            actions: this._actions
        };
    }

    public addAction(action: LockRecordAction): void {
        if (!this._actions) {
            this._actions = [];
        }
        this._actions.push(action);
    }

    public getUnlockRequested(): LockRecordRequestedAction | undefined {
        if (!this._actions?.length) {
            return undefined;
        }
        return this._actions.find(
            (action): action is LockRecordRequestedAction =>
                action.type === RecordLockingLockRecordActionType.requested
        );
    }

    public getUnlockApproved(): LockRecordApprovedAction | undefined {
        if (!this._actions?.length) {
            return undefined;
        }
        return this._actions.find(
            (action): action is LockRecordApprovedAction =>
                action.type === RecordLockingLockRecordActionType.approved
        );
    }

    public getUnlockDenied(): LockRecordDeniedAction | undefined {
        if (!this._actions?.length) {
            return undefined;
        }
        return this._actions.find(
            (action): action is LockRecordDeniedAction =>
                action.type === RecordLockingLockRecordActionType.denied
        );
    }

    public isExpired(): boolean {
        return this._expiresOn.getTime() < new Date().getTime();
    }
}
