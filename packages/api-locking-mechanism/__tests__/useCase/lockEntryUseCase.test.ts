import { LockEntryUseCase } from "~/useCases/LockEntryUseCase/LockEntryUseCase";
import { WebinyError } from "@webiny/error";
import { IIsEntryLockedUseCase } from "~/abstractions/IIsEntryLocked";
import { ILockingMechanismModelManager } from "~/types";
import { NotFoundError } from "@webiny/handler-graphql";

describe("lock entry use case", () => {
    it("should throw an error on isEntryLockedUseCase.execute", async () => {
        expect.assertions(1);
        const useCase = new LockEntryUseCase({
            isEntryLockedUseCase: {
                execute: async () => {
                    throw new WebinyError("Trying out an error", "TRYING_OUT_ERROR", {});
                }
            } as unknown as IIsEntryLockedUseCase,
            getManager: async () => {
                return {} as unknown as ILockingMechanismModelManager;
            }
        });
        try {
            await useCase.execute({
                id: "id1",
                type: "aType"
            });
        } catch (ex) {
            expect(ex).toEqual(new WebinyError("Trying out an error", "TRYING_OUT_ERROR", {}));
        }
    });

    it("should throw an error on creating a lock record", async () => {
        expect.assertions(1);
        const useCase = new LockEntryUseCase({
            isEntryLockedUseCase: {
                execute: async () => {
                    throw new NotFoundError();
                }
            } as unknown as IIsEntryLockedUseCase,
            getManager: async () => {
                return {
                    create: async () => {
                        throw new WebinyError(
                            "Trying out an error on manager.create.",
                            "TRYING_OUT_ERROR",
                            {}
                        );
                    }
                } as unknown as ILockingMechanismModelManager;
            }
        });

        try {
            await useCase.execute({
                id: "id1",
                type: "aType"
            });
        } catch (ex) {
            expect(ex).toEqual(
                new WebinyError(
                    "Could not lock entry: Trying out an error on manager.create.",
                    "TRYING_OUT_ERROR",
                    {}
                )
            );
        }
    });
});
