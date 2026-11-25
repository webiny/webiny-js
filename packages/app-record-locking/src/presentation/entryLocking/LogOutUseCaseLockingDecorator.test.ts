import { describe, expect, it, vi } from "vitest";
import { Container } from "@webiny/di";
import { LogOutUseCase } from "@webiny/app-admin/features/security/LogOut/abstractions.js";
import { RecordLockingPresenter } from "./abstractions.js";
import { LogOutUseCaseLockingDecorator } from "./LogOutUseCaseLockingDecorator.js";

const createUseCase = (release: () => Promise<void>) => {
    const calls: string[] = [];
    const container = new Container();

    container.registerInstance(RecordLockingPresenter, {
        release: vi.fn(async () => {
            calls.push("release");
            await release();
        })
    } as unknown as RecordLockingPresenter.Interface);
    container.registerInstance(LogOutUseCase, {
        execute: vi.fn(async () => {
            calls.push("logOut");
        })
    } as unknown as LogOutUseCase.Interface);
    container.registerDecorator(LogOutUseCaseLockingDecorator);

    return { calls, useCase: container.resolve(LogOutUseCase) };
};

describe("LogOutUseCaseLockingDecorator", () => {
    it("should await the release before logging out", async () => {
        const { calls, useCase } = createUseCase(async () => {
            await new Promise(resolve => setTimeout(resolve, 5));
            calls.push("released");
        });

        await useCase.execute();

        expect(calls).toEqual(["release", "released", "logOut"]);
    });

    it("should still log out when the release fails", async () => {
        const { calls, useCase } = createUseCase(async () => {
            throw new Error("Unauthorized");
        });

        await expect(useCase.execute()).resolves.toBeUndefined();

        expect(calls).toEqual(["release", "logOut"]);
    });
});
