import { Authentication, Authenticator, Identity } from "~/types";

export const createAuthentication = <
    TIdentity extends Identity = Identity
>(): Authentication<TIdentity> => {
    let identity: TIdentity;
    const authenticators: Authenticator<TIdentity>[] = [];

    return {
        getIdentity<TIdentity extends Identity = Identity>(): TIdentity {
            return identity as unknown as TIdentity;
        },

        setIdentity(newIdentity: TIdentity) {
            identity = newIdentity;
        },
        addAuthenticator(authenticator) {
            authenticators.push(authenticator);
        },
        getAuthenticators() {
            return authenticators;
        },
        async authenticate(token: string) {
            for (const authenticator of authenticators) {
                const identity = await authenticator(token);
                if (identity) {
                    this.setIdentity(identity);
                    return;
                }
            }
        }
    };
};
