import React, { useCallback } from "react";
import { useRecoilState } from "recoil";
import { IconButton } from "@webiny/ui/Button";
import { createComponentPlugin } from "@webiny/app-admin";
import { ReactComponent as SettingsIcon } from "./settings.svg";
import { pageSettingsStateAtom } from "~/pageEditor/config/editorBar/PageSettings/state";
import { EditorBar } from "~/editor";

const PageSettingsButton: React.FC = () => {
    const [, setState] = useRecoilState(pageSettingsStateAtom);
    const onClickHandler = useCallback(() => {
        setState(true);
    }, []);

    return <IconButton onClick={onClickHandler} icon={<SettingsIcon />} />;
};

export const AddPageSettingsButton = createComponentPlugin(EditorBar.RightSection, RightSection => {
    return function ComposeRightSection(props) {
        return (
            <RightSection>
                <PageSettingsButton />
                {props.children}
            </RightSection>
        );
    };
});
