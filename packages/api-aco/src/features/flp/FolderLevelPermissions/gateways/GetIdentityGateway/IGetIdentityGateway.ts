import type { Identity } from "@webiny/api-authentication/types.js";

export interface IGetIdentityGateway<TIdentity = Identity> {
    execute: () => TIdentity;
}
