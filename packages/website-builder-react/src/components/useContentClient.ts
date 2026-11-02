"use client";
import { useContext } from "react";
import type { ContentClient } from "@webiny/website-builder-sdk";
import { contentSdk } from "@webiny/website-builder-sdk";
import { ContentClientContext } from "./ContentClientContext.js";

/**
 * Returns the client from the nearest `ContentClientProvider`, or the `contentSdk` singleton
 * when there is none.
 */
export const useContentClient = (): ContentClient => {
    const client = useContext(ContentClientContext);
    return client ?? contentSdk;
};
