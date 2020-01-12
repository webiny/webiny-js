import React from "react";
declare type CrudProviderProps = {
    create?: {
        [key: string]: any;
    };
    read?: {
        [key: string]: any;
    };
    list?: {
        [key: string]: any;
    };
    update?: {
        [key: string]: any;
    };
    delete?: {
        [key: string]: any;
    };
    children: React.ReactElement | Function;
};
export declare const CrudContext: React.Context<{}>;
export declare type CrudContextValue = {
    form: any;
    list: any;
    actions: any;
};
export declare const CrudProvider: ({ children, ...props }: CrudProviderProps) => JSX.Element;
export {};
