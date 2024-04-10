import { CmsEntry, CmsIdentity } from "~/types";
import {
    ILockingMechanismLockRecord,
    ILockingMechanismLockRecordAction,
    ILockingMechanismLockRecordActionType,
    ILockingMechanismLockRecordApprovedAction,
    ILockingMechanismLockRecordDeniedAction,
    ILockingMechanismLockRecordEntryType,
    ILockingMechanismLockRecordObject,
    ILockingMechanismLockRecordRequestedAction,
    ILockingMechanismLockRecordValues
} from "~/types";
import { removeLockRecordDatabasePrefix } from "~/utils/lockRecordDatabaseId";

export const convertEntryToLockRecord = (
    entry: CmsEntry<ILockingMechanismLockRecordValues>
): ILockingMechanismLockRecord => {
    return new HeadlessCmsLockRecord(entry);
};

export type IHeadlessCmsLockRecordParams = Pick<
    CmsEntry<ILockingMechanismLockRecordValues>,
    "entryId" | "values" | "createdBy" | "createdOn" | "savedOn"
>;

export class HeadlessCmsLockRecord implements ILockingMechanismLockRecord {
    private readonly _id: string;
    private readonly _targetId: string;
    private readonly _type: ILockingMechanismLockRecordEntryType;
    private readonly _lockedBy: CmsIdentity;
    private readonly _lockedOn: Date;
    private readonly _updatedOn: Date;
    private _actions?: ILockingMechanismLockRecordAction[];

    public get id(): string {
        return this._id;
    }

    public get targetId(): string {
        return this._targetId;
    }

    public get type(): ILockingMechanismLockRecordEntryType {
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

    public get actions(): ILockingMechanismLockRecordAction[] | undefined {
        return this._actions;
    }

    public constructor(input: IHeadlessCmsLockRecordParams) {
        this._id = removeLockRecordDatabasePrefix(input.entryId);
        this._targetId = input.values.targetId;
        this._type = input.values.type;
        this._lockedBy = input.createdBy;
        this._lockedOn = new Date(input.createdOn);
        this._updatedOn = new Date(input.savedOn);
        this._actions = input.values.actions;
    }

    public toObject(): ILockingMechanismLockRecordObject {
        return {
            id: this._id,
            targetId: this._targetId,
            type: this._type,
            lockedBy: this._lockedBy,
            lockedOn: this._lockedOn,
            updatedOn: this._updatedOn,
            actions: this._actions
        };
    }

    public addAction(action: ILockingMechanismLockRecordAction) {
        if (!this._actions) {
            this._actions = [];
        }
        this._actions.push(action);
    }

    public getUnlockRequested(): ILockingMechanismLockRecordRequestedAction | undefined {
        if (!this._actions?.length) {
            return undefined;
        }
        return this._actions.find(
            (action): action is ILockingMechanismLockRecordRequestedAction =>
                action.type === ILockingMechanismLockRecordActionType.requested
        );
    }

    public getUnlockApproved(): ILockingMechanismLockRecordApprovedAction | undefined {
        if (!this._actions?.length) {
            return undefined;
        }
        return this._actions.find(
            (action): action is ILockingMechanismLockRecordApprovedAction =>
                action.type === ILockingMechanismLockRecordActionType.approved
        );
    }

    public getUnlockDenied(): ILockingMechanismLockRecordDeniedAction | undefined {
        if (!this._actions?.length) {
            return undefined;
        }
        return this._actions.find(
            (action): action is ILockingMechanismLockRecordDeniedAction =>
                action.type === ILockingMechanismLockRecordActionType.denied
        );
    }
}
