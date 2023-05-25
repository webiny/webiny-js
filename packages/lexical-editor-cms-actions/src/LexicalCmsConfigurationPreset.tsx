import {
    TypographyAction
} from "@webiny/lexical-editor";
import React, {FC} from "react";
import {CmsTypographyDropDown} from "./components/ToolbarActionsConfig/CmsTypographyDropDown";
import {AddConfigItem} from "@webiny/lexical-editor/components/AddConfigItem";

export const LexicalCmsConfigurationPreset:FC = ({ children }) => {
    return (
        <AddConfigItem element={<TypographyAction.TypographyDropDown element={<CmsTypographyDropDown />} />} scope={"cms"} />)
}
