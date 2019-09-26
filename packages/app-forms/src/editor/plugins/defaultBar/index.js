//@flow
import React from "react";
import BackButton from "./BackButton";
import Divider from "./Divider";
import PublishFormButton from "./PublishFormButton";
import { Name } from "./Name";
import { FormSettingsButton } from "./FormSettings";
import Revisions from "./Revisions";
import FormOptionsMenu from "./FormOptionsMenu";

export default [
    {
        name: "form-editor-default-bar-right-revisions-select",
        type: "form-editor-default-bar-right",
        render() {
            return <Revisions />;
        }
    },
    {
        name: "form-editor-default-bar-right-revisions-divider",
        type: "form-editor-default-bar-right",
        render() {
            return <Divider />;
        }
    },
    {
        name: "form-editor-default-bar-right-form-settings-button",
        type: "form-editor-default-bar-right",
        render() {
            return <FormSettingsButton />;
        }
    },
    [
        {
            name: "form-editor-default-bar-right-form-options",
            type: "form-editor-default-bar-right",
            render() {
                return <FormOptionsMenu />;
            }
        }
    ],
    {
        name: "form-editor-default-bar-right-publish-button",
        type: "form-editor-default-bar-right",
        render() {
            return <PublishFormButton />;
        }
    },

    {
        name: "form-editor-default-bar-left-back-button",
        type: "form-editor-default-bar-left",
        render() {
            return <BackButton />;
        }
    },
    {
        name: "form-editor-default-bar-left-divider",
        type: "form-editor-default-bar-left",
        render() {
            return <Divider />;
        }
    },
    {
        name: "form-editor-default-bar-left-name",
        type: "form-editor-default-bar-left",
        render() {
            return <Name />;
        }
    }
];
