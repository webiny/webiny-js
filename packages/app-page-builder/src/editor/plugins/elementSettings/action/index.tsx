import React from "react";
import { PbEditorPageElementStyleSettingsPlugin } from "~/types";
import ActionSettings from "./ActionSettings";
import { linkActionType } from "./actionTypes/link";
import { onClickHandlerActionType } from "./actionTypes/onClickHandler";
import { scrollToElementActionType } from "./actionTypes/scrollToElement";

export default [
    {
        name: "pb-editor-page-element-style-settings-action",
        type: "pb-editor-page-element-style-settings",
        render() {
            return <ActionSettings />;
        }
    } as PbEditorPageElementStyleSettingsPlugin,
    linkActionType,
    onClickHandlerActionType,
    scrollToElementActionType
];
