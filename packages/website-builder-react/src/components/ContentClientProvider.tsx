"use client";
import React from "react";
import type { ContentClient } from "@webiny/website-builder-sdk";
import { ContentClientContext } from "./ContentClientContext.js";

interface ContentClientProviderProps {
    client: ContentClient;
    children: React.ReactNode;
}

/**
 * Renders the documents below it with `client`: its component registry, content entry cache,
 * document stores and data. Without this provider, renderers use the `contentSdk` singleton.
 */
export const ContentClientProvider = ({ client, children }: ContentClientProviderProps) => {
    return <ContentClientContext.Provider value={client}>{children}</ContentClientContext.Provider>;
};
