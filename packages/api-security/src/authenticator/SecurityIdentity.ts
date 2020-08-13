type SecurityPermission = {
    name: string;
    [key: string]: any;
};

type SecurityIdentityData = {
    id: string;
    login: string;
    type: string;
    getPermissions?(): Promise<SecurityPermission[]>;
    [key: string]: any;
};

export class SecurityIdentity {
    id: string;
    login: string;
    type: string;
    getPermissions?(): Promise<SecurityPermission[]>;
    constructor(data: SecurityIdentityData) {
        Object.assign(this, data);
    }
}
