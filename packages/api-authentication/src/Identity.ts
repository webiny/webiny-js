export interface IdentityData {
    id: string;
    type: string;
    displayName: string;
    [key: string]: any;
}

export class Identity {
    id: string;
    type: string;
    displayName: string;
    constructor(data: IdentityData) {
        Object.assign(this, data);
    }
}
