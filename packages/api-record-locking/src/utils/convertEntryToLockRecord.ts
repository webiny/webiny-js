import { CmsEntry, IRecordLockingIdentity } from "~/types";
import {
    IRecordLockingLockRecord,
    IRecordLockingLockRecordAction,
    IRecordLockingLockRecordActionType,
    IRecordLockingLockRecordApprovedAction,
    IRecordLockingLockRecordDeniedAction,
    IRecordLockingLockRecordEntryType,
    IRecordLockingLockRecordObject,
    IRecordLockingLockRecordRequestedAction,
    IRecordLockingLockRecordValues
} from "~/types";
import { removeLockRecordDatabasePrefix } from "~/utils/lockRecordDatabaseId";
import { calculateExpiresOn } from "~/utils/calculateExpiresOn";

export const convertEntryToLockRecord = (
    entry: CmsEntry<IRecordLockingLockRecordValues>
): IRecordLockingLockRecord => {
    return new HeadlessCmsLockRecord(entry);
};

export type IHeadlessCmsLockRecordParams = Pick<
    CmsEntry<IRecordLockingLockRecordValues>,
    "entryId" | "values" | "createdBy" | "createdOn" | "savedOn"
>;

export class HeadlessCmsLockRecord implements IRecordLockingLockRecord {
    private readonly _id: string;
    private readonly _targetId: string;
    private readonly _type: IRecordLockingLockRecordEntryType;
    private readonly _lockedBy: IRecordLockingIdentity;
    private readonly _lockedOn: Date;
    private readonly _updatedOn: Date;
    private readonly _expiresOn: Date;
    private _actions?: IRecordLockingLockRecordAction[];

    public get id(): string {
        return this._id;
    }

    public get targetId(): string {
        return this._targetId;
    }

    public get type(): IRecordLockingLockRecordEntryType {
        return this._type;
    }

    public get lockedBy(): IRecordLockingIdentity {
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

    public get actions(): IRecordLockingLockRecordAction[] | undefined {
        return this._actions;
    }

    public constructor(input: IHeadlessCmsLockRecordParams) {
        this._id = removeLockRecordDatabasePrefix(input.entryId);
        this._targetId = input.values.targetId;
        this._type = input.values.type;
        this._lockedBy = input.createdBy;
        this._lockedOn = new Date(input.createdOn);
        this._updatedOn = new Date(input.savedOn);
        this._expiresOn = calculateExpiresOn(input);
        this._actions = input.values.actions;
    }

    public toObject(): IRecordLockingLockRecordObject {
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

    public addAction(action: IRecordLockingLockRecordAction) {
        if (!this._actions) {
            this._actions = [];
        }
        this._actions.push(action);
    }

    public getUnlockRequested(): IRecordLockingLockRecordRequestedAction | undefined {
        if (!this._actions?.length) {
            return undefined;
        }
        return this._actions.find(
            (action): action is IRecordLockingLockRecordRequestedAction =>
                action.type === IRecordLockingLockRecordActionType.requested
        );
    }

    public getUnlockApproved(): IRecordLockingLockRecordApprovedAction | undefined {
        if (!this._actions?.length) {
            return undefined;
        }
        return this._actions.find(
            (action): action is IRecordLockingLockRecordApprovedAction =>
                action.type === IRecordLockingLockRecordActionType.approved
        );
    }

    public getUnlockDenied(): IRecordLockingLockRecordDeniedAction | undefined {
        if (!this._actions?.length) {
            return undefined;
        }
        return this._actions.find(
            (action): action is IRecordLockingLockRecordDeniedAction =>
                action.type === IRecordLockingLockRecordActionType.denied
        );
    }
}
