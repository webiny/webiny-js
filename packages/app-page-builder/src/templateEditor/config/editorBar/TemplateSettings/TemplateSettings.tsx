import React from "react";
import { createComponentPlugin } from "@webiny/app-admin";
import { templateSettingsStateAtom } from "./state";
import { useRecoilValue } from "recoil";
import TemplateSettingsModal from "./TemplateSettingsModal";

/* For the time being, we're importing from the base editor, to not break things for existing users. */
import { EditorBar } from "~/editor";

export const TemplateSettingsOverlay = createComponentPlugin(EditorBar, EditorBar => {
    return function TemplateSettingsOverlay() {
        const isActive = useRecoilValue(templateSettingsStateAtom);

        return (
            <>
                <EditorBar />
                {isActive ? <TemplateSettingsModal /> : null}
            </>
        );
    };
});
