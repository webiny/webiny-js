"use client";
import React, { createContext, useContext } from "react";
import type { ResolvedContentEntries } from "./resolveAutoLoad.js";

const ContentEntryResolutionContext = createContext<ResolvedContentEntries>({});

interface ContentEntryResolutionProviderProps {
    value: ResolvedContentEntries;
    children: React.ReactNode;
}

export const ContentEntryResolutionProvider = ({
    value,
    children
}: ContentEntryResolutionProviderProps) => {
    return (
        <ContentEntryResolutionContext.Provider value={value}>
            {children}
        </ContentEntryResolutionContext.Provider>
    );
};

export const useContentEntryResolution = (): ResolvedContentEntries => {
    return useContext(ContentEntryResolutionContext);
};
