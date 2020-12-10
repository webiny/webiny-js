import React from "react";
import styled from "@emotion/styled";
import { Typography } from "@webiny/ui/Typography";
import { validation } from "@webiny/validation";
import {
    createEmbedPlugin,
    createEmbedSettingsPlugin
} from "./../../utils/oembed/createEmbedPlugin";

import { ReactComponent as LogoIcon } from "./codepen-brands.svg";
import Accordion from "../../../elementSettings/components/Accordion";
import InputField from "../../../elementSettings/components/InputField";
import {
    ButtonContainer,
    SimpleButton
} from "../../../elementSettings/components/StyledComponents";

const PreviewBox = styled("div")({
    textAlign: "center",
    height: 50,
    svg: {
        height: 50,
        width: 50
    }
});

export default () => [
    createEmbedPlugin({
        type: "codepen",
        toolbar: {
            title: "CodePen",
            group: "pb-editor-element-group-code",
            preview() {
                return (
                    <PreviewBox>
                        <LogoIcon />
                    </PreviewBox>
                );
            }
        }
    }),
    createEmbedSettingsPlugin({
        type: "codepen",
        render({ Bind, submit }) {
            return (
                <Accordion title={"CodePen"} defaultValue={true}>
                    <>
                        <Bind name={"source.url"} validators={validation.create("required,url")}>
                            {({ value, onChange }) => (
                                <InputField
                                    value={value}
                                    onChange={onChange}
                                    placeholder={"https://codepen.io/"}
                                    description={"Enter a CodePen URL"}
                                />
                            )}
                        </Bind>
                        <ButtonContainer>
                            <SimpleButton onClick={submit}>
                                <Typography use={"caption"}>Save</Typography>
                            </SimpleButton>
                        </ButtonContainer>
                    </>
                </Accordion>
            );
        }
    })
];
