import React from "react";
import { createComponentPlugin } from "@webiny/app-admin";
import { UIViewComponent } from "@webiny/app-admin/ui/UIView";
import { pageSettingsStateAtom } from "./state";
import { useRecoilValue } from "recoil";

/* For the time being, we're importing from the base editor, to not break things for existing users. */
import { PageSettingsView } from "~/editor/ui/views/PageSettingsView";
import { EditorBar } from "~/editor";

export const PageSettingsOverlay = createComponentPlugin(EditorBar, EditorBar => {
    return function PageSettingsOverlay() {
        const isActive = useRecoilValue(pageSettingsStateAtom);

        return (
            <>
                <EditorBar />
                {isActive ? <UIViewComponent view={new PageSettingsView()} /> : null}
            </>
        );
    };
});
