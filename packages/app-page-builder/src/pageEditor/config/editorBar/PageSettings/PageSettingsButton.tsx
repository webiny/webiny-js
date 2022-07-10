import React, { useCallback } from "react";
import { useRecoilState } from "recoil";
import { IconButton } from "@webiny/ui/Button";
import { ReactComponent as SettingsIcon } from "./settings.svg";
import { HigherOrderComponent } from "@webiny/app-admin";
import { pageSettingsStateAtom } from "~/pageEditor/config/editorBar/PageSettings/state";

const PageSettingsButton: React.FC = () => {
    const [, setState] = useRecoilState(pageSettingsStateAtom);
    const onClickHandler = useCallback(() => {
        setState(true);
    }, []);

    return <IconButton onClick={onClickHandler} icon={<SettingsIcon />} />;
};

export const AddPageSettingsButton: HigherOrderComponent = RightSection => {
    return function AddTitle(props) {
        return (
            <RightSection>
                {props.children}
                <PageSettingsButton />
            </RightSection>
        );
    };
};
