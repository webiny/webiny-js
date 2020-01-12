import React from "react";
import { PbElement } from "@webiny/app-page-builder/admin/types";

export const PageDetailsContext = React.createContext(null);

export type PbPageRevision = {
    id: string;
    title: string;
    url: string;
    version: number;
    parent: string;
    published: boolean;
    isHomePage: boolean;
    isErrorPage: boolean;
    isNotFoundPage: boolean;
    locked: boolean;
    savedOn: string;
};

export type PbPageDetailsContextValue = {
    page: PbPageRevision & {
        snippet: string;
        content: PbElement;
        settings: { [key: string]: any };
        category: {
            id: string;
            name: string;
            url: string;
        };
        revisions: PbPageRevision[];
    };
};

export const PageDetailsProvider = ({ value, children }) => {
    return <PageDetailsContext.Provider value={value}>{children}</PageDetailsContext.Provider>;
};

export const PageDetailsConsumer = ({ children }) => {
    if (typeof children === "function") {
        return (
            <PageDetailsContext.Consumer>
                {pageDetails => children(pageDetails)}
            </PageDetailsContext.Consumer>
        );
    }
    return (
        <PageDetailsContext.Consumer>
            {pageDetails => React.cloneElement(children, { pageDetails })}
        </PageDetailsContext.Consumer>
    );
};
