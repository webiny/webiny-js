import React from "react";
import { BackButtonPlugin } from "./BackButton";
import { PageSettingsPlugin } from "./PageSettings";
import { RevisionsPlugin } from "./Revisions";
import { PublishPageButtonPlugin } from "./PublishPageButton";
import { TitlePlugin } from "./Title";
import { PageOptionsMenuPlugin } from "./PageOptionsMenu";

export const EditorBarPlugins = () => {
    return (
        <>
            <BackButtonPlugin />
            <TitlePlugin />
            <RevisionsPlugin />
            <PageSettingsPlugin />
            <PageOptionsMenuPlugin />
            <PublishPageButtonPlugin />
        </>
    );
};
