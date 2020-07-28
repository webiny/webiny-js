import hasScope from "@webiny/api-security/utils/hasScope";

type SecurityIdentityData = {
    id: string;
    email?: string;
    displayName?: string;
    scopes?: string[];
};

export default class SecurityIdentity {
    id: string;
    email?: string;
    displayName?: string;
    scopes?: string;
    constructor(data: SecurityIdentityData) {
        Object.assign(this, data);
    }

    hasScope(scope: string) {
        return hasScope(scope, this.scopes);
    }
}
