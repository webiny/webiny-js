import React from "react";
import { BackButtonPlugin } from "./BackButton";
import { PageSettingsPlugin } from "./PageSettings";
import { RevisionsPlugin } from "./Revisions";
import { PublishPageButtonPlugin } from "./PublishPageButton";
import { TitlePlugin } from "./Title";
import { PageOptionsMenuPlugin } from "./PageOptionsMenu/PageOptionsMenuPlugin";
import { PreviewPageButtonPlugin } from "./PreviewPageButton/PreviewPageButton";
import { SetAsHomepageButtonPlugin } from "./SetAsHomepageButton/SetAsHomepageButton";

export const EditorBarPlugins = () => {
    return (
        <>
            <BackButtonPlugin />
            <TitlePlugin />
            <RevisionsPlugin />
            <PageSettingsPlugin />
            <PageOptionsMenuPlugin />
            <PublishPageButtonPlugin />
            <PreviewPageButtonPlugin />
            <SetAsHomepageButtonPlugin />
        </>
    );
};
