import React from "react";
import { HigherOrderComponent } from "@webiny/app-admin";
import { UIViewComponent } from "@webiny/app-admin/ui/UIView";
import { pageSettingsStateAtom } from "~/pageEditor/config/editorBar/PageSettings/state";
import { useRecoilValue } from "recoil";

/* For the time being, we're importing from the base editor, to not break things for existing users. */
import { PageSettingsView } from "~/editor/ui/views/PageSettingsView";

export const PageSettingsOverlay: HigherOrderComponent = EditorBar => {
    return function PageSettingsOverlay() {
        const isActive = useRecoilValue(pageSettingsStateAtom);

        return (
            <>
                <EditorBar />
                {isActive ? <UIViewComponent view={new PageSettingsView()} /> : null}
            </>
        );
    };
};
