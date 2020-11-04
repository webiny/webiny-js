import React from "react";
export declare type ReactRouterContextValue = {
    onLink(link: string): void;
};
export declare const RouterContext: React.Context<ReactRouterContextValue>;
export declare const RouterProvider: ({ children }: {
    children: any;
}) => JSX.Element;
export declare const RouterConsumer: ({ children }: {
    children: any;
}) => JSX.Element;
