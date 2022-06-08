import { getIdentity } from "~/index";

describe("getIdentity Test", () => {
    test("full identity information should be returned correctly", async () => {
        expect(
            getIdentity({
                token: {
                    sub: "xyz",
                    family_name: "Family",
                    given_name: "Given",
                    email: "family@given.com"
                },
                identityType: "user"
            })
        ).toEqual({
            displayName: "Given Family",
            email: "family@given.com",
            firstName: "Given",
            id: "xyz",
            lastName: "Family",
            type: "user"
        });
    });

    test(`we must not have "undefined" string in any of the identity properties`, async () => {
        expect(
            getIdentity({
                token: {},
                identityType: "user"
            })
        ).toEqual({
            displayName: null,
            email: null,
            firstName: null,
            id: null,
            lastName: null,
            type: "user"
        });
    });

    test(`when constructing displayName, if lastName is missing, only use firstName and vice versa`, async () => {
        // Last name (family_name) missing - use only first name (given_name).
        expect(
            getIdentity({
                token: {
                    sub: "xyz",
                    given_name: "Given",
                    email: "family@given.com"
                },
                identityType: "user"
            })
        ).toEqual({
            displayName: "Given",
            email: "family@given.com",
            firstName: "Given",
            id: "xyz",
            lastName: null,
            type: "user"
        });

        // First name (given_name) missing - use only last name (family_name).
        expect(
            getIdentity({
                token: {
                    sub: "xyz",
                    family_name: "Family",
                    email: "family@given.com"
                },
                identityType: "user"
            })
        ).toEqual({
            displayName: "Family",
            email: "family@given.com",
            firstName: null,
            id: "xyz",
            lastName: "Family",
            type: "user"
        });
    });
});
