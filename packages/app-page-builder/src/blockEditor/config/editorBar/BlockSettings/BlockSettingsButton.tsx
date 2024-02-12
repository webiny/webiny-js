import React, { useCallback } from "react";
import { useRecoilState } from "recoil";
import { IconButton } from "@webiny/ui/Button";
import { createDecorator } from "@webiny/app-admin";
import { ReactComponent as SettingsIcon } from "./settings.svg";
import { blockSettingsStateAtom } from "./state";
import { EditorBar } from "~/editor";

const BlockSettingsButton = () => {
    const [, setState] = useRecoilState(blockSettingsStateAtom);
    const onClickHandler = useCallback(() => {
        setState(true);
    }, []);

    return <IconButton onClick={onClickHandler} icon={<SettingsIcon />} />;
};

export const AddBlockSettingsButton = createDecorator(EditorBar.RightSection, RightSection => {
    return function ComposeRightSection(props) {
        return (
            <RightSection>
                <BlockSettingsButton />
                {props.children}
            </RightSection>
        );
    };
});
