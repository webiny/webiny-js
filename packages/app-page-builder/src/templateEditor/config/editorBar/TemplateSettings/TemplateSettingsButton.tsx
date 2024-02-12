import React, { useCallback } from "react";
import { useRecoilState } from "recoil";
import { IconButton } from "@webiny/ui/Button";
import { createDecorator } from "@webiny/app-admin";
import { ReactComponent as SettingsIcon } from "@material-design-icons/svg/round/settings.svg";
import { templateSettingsStateAtom } from "./state";
import { EditorBar } from "~/editor";

const TemplateSettingsButton = () => {
    const [, setState] = useRecoilState(templateSettingsStateAtom);
    const onClickHandler = useCallback(() => {
        setState(true);
    }, []);

    return <IconButton onClick={onClickHandler} icon={<SettingsIcon />} />;
};

export const AddTemplateSettingsButton = createDecorator(
    EditorBar.RightSection,
    RightSection => {
        return function ComposeRightSection(props) {
            return (
                <RightSection>
                    <TemplateSettingsButton />
                    {props.children}
                </RightSection>
            );
        };
    }
);
