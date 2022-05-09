import React from "react";
import styled from "@emotion/styled";
import { ReactComponent as TypeformLogo } from "./typeform-logo.svg";
import { ElementRoot } from "@webiny/app-page-builder/render/components/ElementRoot";
import TypeFormEmbed from "./TypeFormEmbed";
import render from "./../render";
import { validation } from "@webiny/validation";
import {
    PbEditorPageElementPlugin,
    PbEditorPageElementAdvancedSettingsPlugin,
    OnCreateActions
} from "@webiny/app-page-builder/types";
import Accordion from "@webiny/app-page-builder/editor/plugins/elementSettings/components/Accordion";
import InputField from "@webiny/app-page-builder/editor/plugins/elementSettings/components/InputField";
import {
    ButtonContainer,
    SimpleButton
} from "@webiny/app-page-builder/editor/plugins/elementSettings/components/StyledComponents";
import { i18n } from "@webiny/app/i18n";
const t = i18n.ns("app-typeform/admin");

const PreviewBox = styled("div")({
    textAlign: "center",
    height: 150,
    svg: {
        height: 150,
        width: 150
    }
});

export default () => [
    render(),
    {
        name: "pb-page-element-typeform",
        type: "pb-editor-page-element",
        elementType: "typeform",
        toolbar: {
            title: "Typeform",
            group: "pb-editor-element-group-form",
            preview() {
                return (
                    <PreviewBox>
                        <TypeformLogo />
                    </PreviewBox>
                );
            }
        },
        settings: [
            "pb-editor-page-element-settings-delete",
            "pb-editor-page-element-settings-height"
        ],
        target: ["column", "row", "list-item"],
        onCreate: OnCreateActions.OPEN_SETTINGS,
        render({ element }) {
            return (
                <ElementRoot element={element} className={"webiny-pb-page-element-typeform"}>
                    <TypeFormEmbed elementId={element.id} />
                </ElementRoot>
            );
        },
        create() {
            return {
                type: "typeform",
                elements: [],
                data: {},
                settings: {
                    style: {
                        height: "500px"
                    }
                }
            };
        }
    } as PbEditorPageElementPlugin,
    {
        name: "pb-editor-page-element-advanced-settings-typeform",
        type: "pb-editor-page-element-advanced-settings",
        elementType: "typeform",
        render({ Bind, submit }) {
            // needed so ts build does not break
            const props: any = {};
            return (
                <Accordion title={t`Typeform`} defaultValue={true}>
                    <React.Fragment>
                        <Bind name={"source.url"} validators={validation.create("required,url")}>
                            <InputField
                                description={t`Enter a Typeform URL`}
                                placeholder={"https://typeform.com"}
                            />
                        </Bind>
                        <ButtonContainer {...props}>
                            <SimpleButton onClick={submit} {...props}>
                                Save
                            </SimpleButton>
                        </ButtonContainer>
                    </React.Fragment>
                </Accordion>
            );
        }
    } as PbEditorPageElementAdvancedSettingsPlugin
];
