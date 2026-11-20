import React from "react";
import { useFeature } from "@webiny/app";
import { GlobalComponentSaveBar } from "~/presentation/globals/GlobalComponentSaveBar/index.js";
import { PageGlobalComponentsFeature } from "./feature.js";

export const PageGlobalComponentSaveBar = () => {
    const { presenter } = useFeature(PageGlobalComponentsFeature);

    return <GlobalComponentSaveBar presenter={presenter} />;
};
