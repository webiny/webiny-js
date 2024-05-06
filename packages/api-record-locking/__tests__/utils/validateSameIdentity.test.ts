import { WebinyError } from "@webiny/error";
import { validateSameIdentity } from "~/utils/validateSameIdentity";
import { createIdentity } from "~tests/helpers/identity";

describe("validate same identity", () => {
    it("should throw an error on not matching identity", async () => {
        expect.assertions(1);

        try {
            validateSameIdentity({
                target: createIdentity(),
                getIdentity: () => {
                    return createIdentity({
                        id: "anotherId",
                        displayName: "some name",
                        type: "admin"
                    });
                }
            });
        } catch (ex) {
            expect(ex).toEqual(
                new WebinyError({
                    message: "Cannot update lock record. Record is locked by another user.",
                    code: "LOCK_UPDATE_ERROR"
                })
            );
        }
    });

    it("should not throw an error on matching identity", async () => {
        expect.assertions(0);
        try {
            validateSameIdentity({
                target: createIdentity(),
                getIdentity: () => {
                    return createIdentity();
                }
            });
        } catch (ex) {
            expect(ex).toEqual(
                new WebinyError({
                    message: "Cannot update lock record. Record is locked by another user.",
                    code: "LOCK_UPDATE_ERROR"
                })
            );
        }
    });
});
