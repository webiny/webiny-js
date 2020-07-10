import hasScope from "@webiny/api-security/utils/hasScope";

type SecurityIdentityData =
    | {
          id: string;
          email?: string;
          displayName?: string;
          scopes?: string[];
      }
    | { [key: string]: any };

export default class SecurityIdentity {
    id: string;
    email?: string;
    displayName?: string;
    scopes?: string[];
    constructor({ displayName, email, id, scopes, ...rest }: SecurityIdentityData = {}) {
        this.id = id;
        this.email = email;
        this.displayName = displayName;
        this.scopes = scopes;
        Object.assign(this, rest);
    }

    hasScope(scope: string) {
        return hasScope(scope, this.scopes);
    }
}
