import React from "react";
import { BackButtonPlugin } from "./BackButton";
import { PageSettingsPlugin } from "./PageSettings";
import { RevisionsPlugin } from "./Revisions";
import { TitlePlugin } from "./Title";

export const EditorBarPlugins = () => {
    return (
        <>
            <BackButtonPlugin />
            <TitlePlugin />
            <PageSettingsPlugin />
            <RevisionsPlugin />
        </>
    );
};
