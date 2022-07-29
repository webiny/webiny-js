import { AuthenticationContext, Authenticator, Identity } from "~/types";
import { createAuthentication } from "~/createAuthentication";
import { authenticateUsingHttpHeader } from "~/authenticateUsingHttpHeader";

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

describe("authenticateUsingHttpHeader", () => {
    it("should properly authenticate via headers", async () => {
        const auth = createAuthentication<Identity>();
        auth.addAuthenticator(authenticator);

        expect(auth.getIdentity()).toEqual(undefined);

        const headerAuthCallable = authenticateUsingHttpHeader();

        await headerAuthCallable.apply({
            request: {
                headers: {
                    authorization: `Bearer ${token}`
                },
                method: "POST"
            },
            authentication: auth
        } as unknown as AuthenticationContext);

        expect(auth.getIdentity()).toEqual(identity);
    });
});
