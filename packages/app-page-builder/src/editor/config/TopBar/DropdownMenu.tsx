import React from "react";
import {Element as BaseElement} from "~/editor/config/Element";
import {ActionProps} from "~/editor/config/TopBar";

export const DropdownMenu = () => {

}

const DropdownAction = (props: ActionProps) => {
    return <BaseElement {...props} scope={"topBar"} group={"dropdownActions"} />;
};
