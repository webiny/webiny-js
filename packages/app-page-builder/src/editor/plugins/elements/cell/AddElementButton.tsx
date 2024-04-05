import React from "react";
import { makeDecoratable } from "@webiny/app-admin";
import { IconButton } from "@webiny/ui/Button";
import { PbEditorElement } from "~/types";
import { ReactComponent as AddCircleOutline } from "~/editor/assets/icons/baseline-add_circle-24px.svg";

const defaultOnClick = () => {
    console.warn(`EmptyCell "onClick" is not implemented!`);
};

export interface AddElementButtonProps {
    element: PbEditorElement;
    className?: string;
    icon?: JSX.Element;
    onClick?: (element: PbEditorElement) => void;
}

export const AddElementButton = makeDecoratable(
    "AddElementButton",
    ({
        icon = <AddCircleOutline />,
        element,
        onClick = defaultOnClick,
        className = "addIcon"
    }: AddElementButtonProps) => {
        return <IconButton className={className} icon={icon} onClick={() => onClick(element)} />;
    }
);
