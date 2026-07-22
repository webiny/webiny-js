import React from "react";
import { InternalContentEntryEditorConfig } from "@webiny/app-headless-cms";
import { CommentsToggle } from "~/presentation/comments/components/CommentsToggle.js";

const { Actions } = InternalContentEntryEditorConfig;

export const CommentsHeaderButton = () => {
    return (
        <InternalContentEntryEditorConfig>
            <Actions.ButtonAction
                before={"revisionSelector"}
                name={"comments"}
                element={<CommentsToggle />}
            />
        </InternalContentEntryEditorConfig>
    );
};
