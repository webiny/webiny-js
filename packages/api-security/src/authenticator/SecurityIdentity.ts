type SecurityIdentityData = {
    id: string;
    type: string;
    displayName: string;
    [key: string]: any;
};

export class SecurityIdentity {
    id: string;
    type: string;
    displayName: string;
    constructor(data: SecurityIdentityData) {
        Object.assign(this, data);
    }
}
