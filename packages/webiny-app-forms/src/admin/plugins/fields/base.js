// @flow
import React from "react";
import { ReactComponent as TextIcon } from "./icons/round-text_fields-24px.svg";
import type { FormEditorFieldPluginType } from "webiny-app-forms/types";

export default ([
    {
        type: "form-editor-field-type",
        name: "form-editor-field-type-rich-text",
        fieldType: {
            dataType: true,
            id: "rich-text",
            validators: ["required"],
            label: "Rich Text",
            description: "Articles or any other type of longer text",
            icon: <TextIcon />,
            createField() {
                return {
                    id: "",
                    label: "",
                    type: this.id,
                    validation: []
                };
            }
        }
    },
    {
        type: "form-editor-field-type",
        name: "form-editor-field-type-radio",
        fieldType: {
            dataType: true,
            id: "radio",
            validators: ["required"],
            label: "Radio buttons",
            description: "Give users the ability to choose one option",
            icon: <TextIcon />,
            createField() {
                return {
                    id: "",
                    label: "",
                    type: this.id,
                    validation: []
                };
            }
        }
    },
    {
        type: "form-editor-field-type",
        name: "form-editor-field-type-checkbox",
        fieldType: {
            dataType: true,
            id: "checkbox",
            validators: ["required"],
            label: "Checkbox",
            description: "For Simple yes / no questions",
            icon: <TextIcon />,
            createField() {
                return {
                    id: "",
                    label: "",
                    type: this.id,
                    validation: []
                };
            }
        }
    },
    {
        type: "form-editor-field-type",
        name: "form-editor-field-type-checkboxes",
        fieldType: {
            dataType: true,
            id: "checkboxes",
            validators: ["required", "minLength", "maxLength"],
            label: "Checkboxes",
            description: "Give users ability to choose one or more options",
            icon: <TextIcon />,
            createField() {
                return {
                    id: "",
                    label: "",
                    type: this.id,
                    validation: []
                };
            }
        }
    }
]: Array<FormEditorFieldPluginType>);
