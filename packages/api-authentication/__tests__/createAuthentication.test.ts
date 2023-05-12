import { createAuthentication } from "~/createAuthentication";
import { Authenticator, Identity } from "~/types";

const identity: Identity = {
    id: "1",
    type: "admin",
    displayName: "name"
};

const token = "fehu24fgjdsnfjdsnkf";

const authenticator: Authenticator = async input => {
    if (input !== token) {
        return null;
    }
    return identity;
};

describe("createAuthentication", () => {
    it("should properly create authentication", async () => {
        const auth = createAuthentication();

        expect(auth).toEqual({
            getIdentity: expect.any(Function),
            addAuthenticator: expect.any(Function),
            getAuthenticators: expect.any(Function),
            setIdentity: expect.any(Function),
            authenticate: expect.any(Function)
        });
    });

    it("should set identity", async () => {
        const auth = createAuthentication<Identity>();
        auth.setIdentity(identity);

        expect(auth.getIdentity()).toEqual(identity);
    });

    it("should add authenticator", async () => {
        const auth = createAuthentication();
        auth.addAuthenticator(authenticator);

        expect(auth.getAuthenticators()).toEqual([authenticator]);
    });

    it("should authenticate", async () => {
        const auth = createAuthentication();
        auth.addAuthenticator(authenticator);

        await auth.authenticate(token);

        expect(auth.getIdentity()).toEqual(identity);
    });

    it("should not authenticate", async () => {
        const auth = createAuthentication();
        auth.addAuthenticator(authenticator);

        await auth.authenticate("wrong-token");

        expect(auth.getIdentity()).toEqual(undefined);
    });
});
