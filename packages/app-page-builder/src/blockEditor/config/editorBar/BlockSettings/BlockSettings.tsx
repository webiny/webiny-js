import React from "react";
import { createDecorator } from "@webiny/app-admin";
import { blockSettingsStateAtom } from "./state";
import { useRecoilValue } from "recoil";
import BlockSettingsModal from "./BlockSettingsModal";

/* For the time being, we're importing from the base editor, to not break things for existing users. */
import { EditorBar } from "~/editor";

export const BlockSettingsOverlay = createDecorator(EditorBar, EditorBar => {
    return function BlockSettingsOverlay() {
        const isActive = useRecoilValue(blockSettingsStateAtom);

        return (
            <>
                <EditorBar />
                {isActive ? <BlockSettingsModal /> : null}
            </>
        );
    };
});
