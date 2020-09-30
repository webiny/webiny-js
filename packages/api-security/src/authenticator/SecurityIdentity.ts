type SecurityIdentityData = {
    id: string;
    login: string;
    type: string;
    [key: string]: any;
};

export class SecurityIdentity {
    id: string;
    login: string;
    type: string;
    constructor(data: SecurityIdentityData) {
        Object.assign(this, data);
    }
}
