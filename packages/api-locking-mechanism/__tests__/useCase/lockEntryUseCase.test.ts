import { LockEntryUseCase } from "~/useCases/LockEntryUseCase/LockEntryUseCase";
import { WebinyError } from "@webiny/error";
import { IIsEntryLockedUseCase } from "~/abstractions/IsEntryLocked";
import { ILockingMechanismModelManager } from "~/types";

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
});
