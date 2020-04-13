import React from "react";
import BackButton from "./BackButton";
import Divider from "./Divider";
import SaveContentModelButton from "./SaveContentModelButton";
import { Name } from "./Name";
import { FormSettingsButton } from "./FormSettings";

export default [
    {
        name: "content-model-editor-default-bar-right-form-settings-button",
        type: "content-model-editor-default-bar-right",
        render() {
            return <FormSettingsButton />;
        }
    },
    {
        name: "content-model-editor-default-bar-right-publish-button",
        type: "content-model-editor-default-bar-right",
        render() {
            return <SaveContentModelButton />;
        }
    },

    {
        name: "content-model-editor-default-bar-left-back-button",
        type: "content-model-editor-default-bar-left",
        render() {
            return <BackButton />;
        }
    },
    {
        name: "content-model-editor-default-bar-left-divider",
        type: "content-model-editor-default-bar-left",
        render() {
            return <Divider />;
        }
    },
    {
        name: "content-model-editor-default-bar-left-name",
        type: "content-model-editor-default-bar-left",
        render() {
            return <Name />;
        }
    }
];
