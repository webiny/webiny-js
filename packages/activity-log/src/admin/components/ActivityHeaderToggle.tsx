import React from "react";
import { ContentEntryEditorConfig } from "@webiny/app-headless-cms";
import { ActivityToggleButton } from "./ActivityToggleButton.js";

const { Actions } = ContentEntryEditorConfig;

export const ActivityHeaderToggle = () => (
    <ContentEntryEditorConfig>
        {/*
          `before` is resolved by name, and an unresolved name falls to the end of the toolbar
          rather than erroring. `comments` is registered by the collaboration extension, which
          every project gets by default — so on a project that removes it, this lands after the
          save actions instead of before them. Worth knowing if the toolbar ever looks wrong.
        */}
        <Actions.ButtonAction
            before={"comments"}
            name={"activityLog"}
            element={<ActivityToggleButton />}
        />
    </ContentEntryEditorConfig>
);
