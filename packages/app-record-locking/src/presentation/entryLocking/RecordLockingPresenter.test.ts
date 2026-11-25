import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Mock } from "vitest";
import { Container } from "@webiny/di";
import { IdentityContext } from "@webiny/app-admin/features/security/IdentityContext/abstractions.js";
import { AcquireLockUseCase } from "~/features/acquireLock/abstractions.js";
import { CheckLockStatusUseCase } from "~/features/checkLockStatus/abstractions.js";
import { ReleaseLockUseCase } from "~/features/releaseLock/abstractions.js";
import { ForceUnlockUseCase } from "~/features/forceUnlock/abstractions.js";
import { RecordLockingPresenter as Abstraction } from "./abstractions.js";
import { RecordLockingPresenter } from "./RecordLockingPresenter.js";

const LOCK_RECORD = { id: "lock-1", targetId: "entry-1" };

describe("RecordLockingPresenter", () => {
    let presenter: Abstraction.Interface;
    let acquire: Mock;
    let checkStatus: Mock;
    let release: Mock;
    let windowTarget: EventTarget;

    beforeEach(() => {
        windowTarget = new EventTarget();
        vi.stubGlobal("window", windowTarget);

        acquire = vi.fn(async () => LOCK_RECORD);
        checkStatus = vi.fn(async () => null);
        release = vi.fn(async () => LOCK_RECORD);

        const container = new Container();
        container.registerInstance(AcquireLockUseCase, {
            execute: acquire
        } as unknown as AcquireLockUseCase.Interface);
        container.registerInstance(CheckLockStatusUseCase, {
            execute: checkStatus
        } as unknown as CheckLockStatusUseCase.Interface);
        container.registerInstance(ReleaseLockUseCase, {
            execute: release
        } as unknown as ReleaseLockUseCase.Interface);
        container.registerInstance(ForceUnlockUseCase, {
            execute: vi.fn()
        } as unknown as ForceUnlockUseCase.Interface);
        container.registerInstance(IdentityContext, {
            getIdentity: () => ({ getPermission: () => undefined })
        } as unknown as IdentityContext.Interface);
        container.register(RecordLockingPresenter).inSingletonScope();

        presenter = container.resolve(Abstraction);
    });

    afterEach(() => {
        presenter.dispose();
        vi.unstubAllGlobals();
    });

    describe("release", () => {
        it("should release the lock once and clear state, so dispose sends no second unlock", async () => {
            await presenter.init("entry-1", "cms");
            expect(presenter.vm.status).toBe("acquired");

            await presenter.release();

            expect(release).toHaveBeenCalledTimes(1);
            expect(release).toHaveBeenCalledWith({ id: "entry-1", type: "cms" });
            expect(presenter.vm.status).toBeNull();
            expect(presenter.vm.lockRecord).toBeNull();

            presenter.dispose();
            expect(release).toHaveBeenCalledTimes(1);
        });

        it("should be a no-op when the lock is not acquired", async () => {
            await presenter.release();
            expect(release).not.toHaveBeenCalled();

            checkStatus.mockResolvedValueOnce(LOCK_RECORD);
            await presenter.init("entry-1", "cms");
            expect(presenter.vm.status).toBe("locked");

            await presenter.release();
            expect(release).not.toHaveBeenCalled();
        });
    });

    describe("pagehide", () => {
        it("should send a keepalive unlock and keep the acquired state", async () => {
            await presenter.init("entry-1", "cms");

            windowTarget.dispatchEvent(new Event("pagehide"));

            expect(release).toHaveBeenCalledTimes(1);
            expect(release).toHaveBeenCalledWith({ id: "entry-1", type: "cms", keepalive: true });
            expect(presenter.vm.status).toBe("acquired");
        });

        it("should send nothing after dispose", async () => {
            await presenter.init("entry-1", "cms");
            presenter.dispose();
            release.mockClear();

            windowTarget.dispatchEvent(new Event("pagehide"));

            expect(release).not.toHaveBeenCalled();
        });

        it("should send nothing when the lock is not acquired", async () => {
            checkStatus.mockResolvedValueOnce(LOCK_RECORD);
            await presenter.init("entry-1", "cms");

            windowTarget.dispatchEvent(new Event("pagehide"));

            expect(release).not.toHaveBeenCalled();
        });
    });
});
