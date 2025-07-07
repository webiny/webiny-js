"use client";
import React from "react";
import { initContentSdk } from "./initContentSdk";

export const ContentSdkInitializer = React.memo(({ draftMode }: { draftMode: boolean }) => {
    initContentSdk({ preview: draftMode });

    return null;
});

ContentSdkInitializer.displayName = "ContentSdkInitializer";
