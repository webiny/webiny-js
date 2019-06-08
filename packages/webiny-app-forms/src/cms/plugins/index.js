// @flow
import React from "react";
import styled from "react-emotion";
import { Tab } from "webiny-ui/Tabs";
import FormElementAdvancedSettings from "./components/FormElementAdvancedSettings";
import FormElement from "./components/FormElement";
import { ReactComponent as FormLogo } from "./components/icons/round-description-24px.svg";

const PreviewBox = styled("div")({
    textAlign: "center",
    height: 80,
    svg: {
        height: 80,
        width: "auto"
    }
});

export default [
    {
        name: "cms-element-form",
        type: "cms-element",
        toolbar: {
            title: "Form",
            group: "cms-element-group-form",
            preview() {
                return (
                    <PreviewBox>
                        <FormLogo />
                    </PreviewBox>
                );
            }
        },
        settings: ["cms-element-settings-delete", "", "cms-element-settings-height"],
        target: ["cms-element-column", "cms-element-row", "cms-element-list-item"],
        onCreate: "open-settings",
        render({ element }: Object) {
            return <FormElement element={element} />;
        },
        create() {
            return {
                type: "cms-element-form",
                elements: [],
                data: {},
                settings: {}
            };
        }
    },
    {
        name: "cms-element-advanced-settings-form",
        type: "cms-element-advanced-settings",
        element: "cms-element-form",
        render(props: Object) {
            return (
                <Tab label="Form">
                    <FormElementAdvancedSettings {...props} />
                </Tab>
            );
        }
    }
];
