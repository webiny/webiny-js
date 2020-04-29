import React from "react";
import BackButton from "./BackButton";
import Divider from "./Divider";
import PublishButton from "./PublishButton";
import { Name } from "./Name";
import { FormSettingsButton } from "./FormSettings";
import Revisions from "./Revisions";

export default [
    /* {
        name: "content-model-editor-default-bar-right-revisions-select",
        type: "content-model-editor-default-bar-right",
        render() {
            return <Revisions />;
        }
    },
    {
        name: "content-model-editor-default-bar-right-revisions-divider",
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
    },*/
    {
        name: "content-model-editor-default-bar-right-publish-button",
        type: "content-model-editor-default-bar-right",
        render() {
            return <PublishButton />;
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
