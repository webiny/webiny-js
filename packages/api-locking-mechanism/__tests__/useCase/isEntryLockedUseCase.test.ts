import { IsEntryLockedUseCase } from "~/useCases/IsEntryLocked/IsEntryLockedUseCase";
import { WebinyError } from "@webiny/error";
import { ILockingMechanismLockRecord } from "~/types";
import { NotFoundError } from "@webiny/handler-graphql";
import { isLockedFactory } from "~/utils/isLockedFactory";

describe("is entry locked use case", () => {
    const timeout = 600000;
    const isLocked = isLockedFactory(timeout);

    it("should return false if lock record is not found - object param", async () => {
        const useCase = new IsEntryLockedUseCase({
            getLockRecordUseCase: {
                async execute() {
                    throw new NotFoundError();
                }
            },
            isLocked
        });

        const result = await useCase.execute({
            id: "aTestId#0001",
            type: "aTestType"
        });

        expect(result).toBe(false);
    });

    it("should return false if lock record is not locked", async () => {
        const useCase = new IsEntryLockedUseCase({
            getLockRecordUseCase: {
                async execute() {
                    return {
                        lockedOn: new Date("2020-01-01")
                    } as unknown as ILockingMechanismLockRecord;
                }
            },
            isLocked
        });

        const result = await useCase.execute({
            id: "aTestId#0001",
            type: "aTestType"
        });

        expect(result).toBe(false);
    });

    it("should throw an error on error in getLockRecordUseCase", async () => {
        expect.assertions(1);

        const useCase = new IsEntryLockedUseCase({
            getLockRecordUseCase: {
                async execute() {
                    throw new WebinyError("Testing error.", "TESTING_ERROR");
                }
            },
            isLocked
        });

        try {
            await useCase.execute({
                id: "aTestId#0001",
                type: "aTestType"
            });
        } catch (ex) {
            expect(ex).toEqual(new WebinyError("Testing error.", "TESTING_ERROR"));
        }
    });
});
