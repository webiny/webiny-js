import React from "react";
import Divider from "./Divider";
import SaveContentModelButton from "./SaveContentModelButton";
import CreateContentButton from "./CreateContentButton";
import { FormSettingsButton } from "./FormSettings";

export default [
    {
        name: "content-model-editor-default-bar-right-create-content-button",
        type: "content-model-editor-default-bar-right",
        render() {
            return <CreateContentButton />;
        }
    },
    {
        name: "content-model-editor-default-bar-left-divider",
        type: "content-model-editor-default-bar-right",
        render() {
            return <Divider />;
        }
    },
    {
        name: "content-model-editor-default-bar-right-form-settings-button",
        type: "content-model-editor-default-bar-right",
        render() {
            return <FormSettingsButton />;
        }
    },
    {
        name: "content-model-editor-default-bar-right-save-button",
        type: "content-model-editor-default-bar-right",
        render() {
            return <SaveContentModelButton />;
        }
    }
];
