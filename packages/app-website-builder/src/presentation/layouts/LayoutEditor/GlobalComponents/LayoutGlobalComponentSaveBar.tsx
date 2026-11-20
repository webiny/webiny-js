import React from "react";
import { useFeature } from "@webiny/app";
import { GlobalComponentSaveBar } from "~/presentation/globals/GlobalComponentSaveBar/index.js";
import { LayoutGlobalComponentsFeature } from "./feature.js";

export const LayoutGlobalComponentSaveBar = () => {
    const { presenter } = useFeature(LayoutGlobalComponentsFeature);

    return <GlobalComponentSaveBar presenter={presenter} />;
};
