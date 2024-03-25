import { CmsEntry, CmsIdentity } from "~/types";
import {
    IHeadlessCmsLockRecord,
    IHeadlessCmsLockRecordAction,
    IHeadlessCmsLockRecordActionType,
    IHeadlessCmsLockRecordApprovedAction,
    IHeadlessCmsLockRecordDeniedAction,
    IHeadlessCmsLockRecordEntryType,
    IHeadlessCmsLockRecordRequestedAction,
    IHeadlessCmsLockRecordValues
} from "~/lockingMechanism/types";
import { removeLockRecordDatabasePrefix } from "~/lockingMechanism/utils/lockRecordDatabaseId";

export const convertEntryToLockRecord = (
    entry: CmsEntry<IHeadlessCmsLockRecordValues>
): IHeadlessCmsLockRecord => {
    return new HeadlessCmsLockRecord(entry);
};

export type IHeadlessCmsLockRecordParams = Pick<
    CmsEntry<IHeadlessCmsLockRecordValues>,
    "entryId" | "values" | "createdBy" | "createdOn"
>;

export class HeadlessCmsLockRecord implements IHeadlessCmsLockRecord {
    private readonly _id: string;
    private readonly _targetId: string;
    private readonly _type: IHeadlessCmsLockRecordEntryType;
    private readonly _lockedBy: CmsIdentity;
    private readonly _lockedOn: Date;
    private _actions?: IHeadlessCmsLockRecordAction[];

    public get id(): string {
        return this._id;
    }

    public get targetId(): string {
        return this._targetId;
    }

    public get type(): IHeadlessCmsLockRecordEntryType {
        return this._type;
    }

    public get lockedBy(): CmsIdentity {
        return this._lockedBy;
    }

    public get lockedOn(): Date {
        return this._lockedOn;
    }

    public get actions(): IHeadlessCmsLockRecordAction[] | undefined {
        return this._actions;
    }

    public constructor(input: IHeadlessCmsLockRecordParams) {
        this._id = removeLockRecordDatabasePrefix(input.entryId);
        this._targetId = input.values.targetId;
        this._type = input.values.type;
        this._lockedBy = input.createdBy;
        this._lockedOn = new Date(input.createdOn);
        this._actions = input.values.actions;
    }

    public addAction(action: IHeadlessCmsLockRecordAction) {
        if (!this._actions) {
            this._actions = [];
        }
        this._actions.push(action);
    }

    public getUnlockRequested(): IHeadlessCmsLockRecordRequestedAction | undefined {
        if (!this._actions?.length) {
            return undefined;
        }
        return this._actions.find(
            (action): action is IHeadlessCmsLockRecordRequestedAction =>
                action.type === IHeadlessCmsLockRecordActionType.request
        );
    }

    public getUnlockApproved(): IHeadlessCmsLockRecordApprovedAction | undefined {
        if (!this._actions?.length) {
            return undefined;
        }
        return this._actions.find(
            (action): action is IHeadlessCmsLockRecordApprovedAction =>
                action.type === IHeadlessCmsLockRecordActionType.approved
        );
    }

    public getUnlockDenied(): IHeadlessCmsLockRecordDeniedAction | undefined {
        if (!this._actions?.length) {
            return undefined;
        }
        return this._actions.find(
            (action): action is IHeadlessCmsLockRecordDeniedAction =>
                action.type === IHeadlessCmsLockRecordActionType.denied
        );
    }
}
