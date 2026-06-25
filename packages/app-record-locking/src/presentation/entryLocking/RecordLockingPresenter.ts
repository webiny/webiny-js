import { computed, makeAutoObservable, runInAction } from "mobx";
import { parseIdentifier } from "@webiny/utils";
import { IdentityContext } from "@webiny/app-admin/features/security/IdentityContext/abstractions.js";
import { AcquireLockUseCase } from "~/features/acquireLock/abstractions.js";
import { CheckLockStatusUseCase } from "~/features/checkLockStatus/abstractions.js";
import { ReleaseLockUseCase } from "~/features/releaseLock/abstractions.js";
import { ForceUnlockUseCase } from "~/features/forceUnlock/abstractions.js";
import {
    RecordLockingPresenter as Abstraction,
    type IRecordLockingPresenter,
    type IRecordLockingViewModel,
    type IKickOutData,
    type RecordLockingStatus
} from "./abstractions.js";
import type { IRecordLockingLockRecord } from "~/types.js";

const HEARTBEAT_INTERVAL_MS = 20_000;

class RecordLockingPresenterImpl implements IRecordLockingPresenter {
    private _status: RecordLockingStatus = null;
    private _lockRecord: IRecordLockingLockRecord | null = null;
    private _entryId: string | null = null;
    private _type: string | null = null;
    private _heartbeatTimer: ReturnType<typeof setInterval> | null = null;

    constructor(
        private acquireLockUseCase: AcquireLockUseCase.Interface,
        private checkLockStatusUseCase: CheckLockStatusUseCase.Interface,
        private releaseLockUseCase: ReleaseLockUseCase.Interface,
        private forceUnlockUseCase: ForceUnlockUseCase.Interface,
        private identityContext: IdentityContext.Interface
    ) {
        makeAutoObservable<
            RecordLockingPresenterImpl,
            | "acquireLockUseCase"
            | "checkLockStatusUseCase"
            | "releaseLockUseCase"
            | "forceUnlockUseCase"
            | "identityContext"
        >(this, {
            acquireLockUseCase: false,
            checkLockStatusUseCase: false,
            releaseLockUseCase: false,
            forceUnlockUseCase: false,
            identityContext: false,
            vm: computed
        });
    }

    get vm(): IRecordLockingViewModel {
        return {
            status: this._status,
            lockRecord: this._lockRecord,
            lockedByUserName: this._lockRecord?.lockedBy?.displayName ?? null,
            canForceUnlock: this.checkCanForceUnlock(),
            canEdit: this._status === "acquired"
        };
    }

    private checkCanForceUnlock(): boolean {
        const identity = this.identityContext.getIdentity();

        if (identity.getPermission("recordLocking.*")) {
            return true;
        }

        const permission = identity.getPermission("recordLocking");
        return permission?.canForceUnlock === true;
    }

    async init(entryId: string, type: string): Promise<void> {
        const { id } = parseIdentifier(entryId);

        this._entryId = id;
        this._type = type;
        this._status = "checking";

        try {
            const lockRecord = await this.checkLockStatusUseCase.execute({
                id,
                type
            });

            if (lockRecord) {
                runInAction(() => {
                    this._status = "locked";
                    this._lockRecord = lockRecord;
                });
                return;
            }

            const acquired = await this.acquireLockUseCase.execute({
                id,
                type
            });

            runInAction(() => {
                this._status = "acquired";
                this._lockRecord = acquired;
            });

            this.startHeartbeat(id, type);
        } catch {
            runInAction(() => {
                this._status = "error";
            });
        }
    }

    async refreshLock(): Promise<void> {
        if (this._status !== "acquired" || !this._entryId || !this._type) {
            return;
        }

        try {
            const record = await this.acquireLockUseCase.execute({
                id: this._entryId,
                type: this._type
            });

            runInAction(() => {
                this._lockRecord = record;
            });
        } catch {
            // Heartbeat will retry
        }
    }

    async forceUnlock(): Promise<boolean> {
        if (!this._lockRecord || !this._type) {
            return false;
        }

        try {
            await this.forceUnlockUseCase.execute({
                id: this._lockRecord.targetId,
                type: this._type
            });

            const acquired = await this.acquireLockUseCase.execute({
                id: this._lockRecord.targetId,
                type: this._type
            });

            runInAction(() => {
                this._status = "acquired";
                this._lockRecord = acquired;
            });

            this.startHeartbeat(this._lockRecord.targetId, this._type);

            return true;
        } catch {
            return false;
        }
    }

    handleKickOut(data: IKickOutData): void {
        this.stopHeartbeat();

        runInAction(() => {
            this._status = "kicked-out";
            this._lockRecord = data.record;
        });
    }

    dispose(): void {
        this.stopHeartbeat();

        if (this._status === "acquired" && this._entryId && this._type) {
            this.releaseLockUseCase
                .execute({ id: this._entryId, type: this._type })
                .catch(() => {});
        }

        this._status = null;
        this._lockRecord = null;
        this._entryId = null;
        this._type = null;
    }

    private startHeartbeat(entryId: string, type: string): void {
        this.stopHeartbeat();

        this._heartbeatTimer = setInterval(async () => {
            try {
                const record = await this.acquireLockUseCase.execute({ id: entryId, type });
                runInAction(() => {
                    this._lockRecord = record;
                });
            } catch {
                this.stopHeartbeat();
                runInAction(() => {
                    this._status = "error";
                });
            }
        }, HEARTBEAT_INTERVAL_MS);
    }

    private stopHeartbeat(): void {
        if (this._heartbeatTimer !== null) {
            clearInterval(this._heartbeatTimer);
            this._heartbeatTimer = null;
        }
    }
}

export const RecordLockingPresenter = Abstraction.createImplementation({
    implementation: RecordLockingPresenterImpl,
    dependencies: [
        AcquireLockUseCase,
        CheckLockStatusUseCase,
        ReleaseLockUseCase,
        ForceUnlockUseCase,
        IdentityContext
    ]
});
