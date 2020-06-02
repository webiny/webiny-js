import React, { ReactElement } from "react";
export declare const SecurityContext: React.Context<any>;
export declare const DEFAULT_AUTH_TOKEN = "webiny-token";
declare type Props = {
    loader?: ReactElement;
    allowAnonymous?: Boolean;
    AUTH_TOKEN?: String;
    getUser?: () => Promise<{
        [key: string]: any;
    }>;
    onUser?: (user: {
        [key: string]: any;
    }) => void;
    children?: React.ReactNode;
};
export declare const SecurityConsumer: ({ children }: {
    children: any;
}) => JSX.Element;
export declare type SecurityContextValue = {
    user: {
        [key: string]: any;
    };
    logout(): Promise<void>;
    renderAuthentication(params?: {
        viewProps: {};
    }): React.ReactElement;
    refreshUser(): Promise<void>;
};
export declare const SecurityProvider: {
    (props: Props): JSX.Element;
    defaultProps: {
        allowAnonymous: boolean;
    };
};
export {};
