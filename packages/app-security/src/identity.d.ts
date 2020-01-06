export declare type ResourcesType = Array<string> | {
    [key: string]: Array<string>;
};
export declare type OptionsType = {
    forceBoolean?: boolean;
};
declare class Identity {
    data: any;
    constructor(data?: {
        [key: string]: any;
    });
    isLoggedIn(): boolean;
    hasFullAccess(): boolean;
    getScopes(): Array<string>;
    hasScope(scope: string): boolean;
    hasRole(role: string): boolean;
    getRoles(): Array<string>;
    hasScopes(scopes: ResourcesType, options: OptionsType): any;
    hasRoles(roles: ResourcesType, options: OptionsType): any;
    __hasResources({ type, resources, options }: {
        type: string;
        resources: ResourcesType;
        options: OptionsType;
    }): any;
}
export declare const getIdentity: () => Identity;
export declare const setIdentity: (data: any) => void;
export {};
