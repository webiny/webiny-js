/**
 * Contains a list of all registered scopes throughout GraphQL Schema.
 * @type {Array}
 */
export declare const __scopes: {
    registered: any[];
};
export declare const registerScopes: (...scopes: string[]) => void;
export declare const getRegisteredScopes: () => any[];
export declare const hasScope: (scope: string) => import("graphql-shield/dist/rules").Rule;
export declare const hasRole: (role: string) => import("graphql-shield/dist/rules").Rule;
