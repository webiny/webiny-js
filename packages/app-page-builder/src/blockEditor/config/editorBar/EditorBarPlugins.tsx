import React from "react";
import { BackButtonPlugin } from "./BackButton";
import { SaveBlockButtonPlugin } from "./SaveBlockButton";
import { TitlePlugin } from "./Title";

export const EditorBarPlugins = () => {
    return (
        <>
            <BackButtonPlugin />
            <TitlePlugin />
            <SaveBlockButtonPlugin />
        </>
    );
};
