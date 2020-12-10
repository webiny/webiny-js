import React from "react";
import styled from "@emotion/styled";
import { Typography } from "@webiny/ui/Typography";
import { validation } from "@webiny/validation";
import {
    createEmbedPlugin,
    createEmbedSettingsPlugin
} from "./../../utils/oembed/createEmbedPlugin";
import { ReactComponent as LogoIcon } from "./soundcloud-brands.svg";
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
        type: "soundcloud",
        toolbar: {
            title: "Soundcloud",
            group: "pb-editor-element-group-media",
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
        type: "soundcloud",
        render({ Bind, submit }) {
            return (
                <Accordion title={"SoundCloud"} defaultValue={true}>
                    <>
                        <Bind name={"source.url"} validators={validation.create("required,url")}>
                            {({ value, onChange }) => (
                                <InputField
                                    value={value}
                                    onChange={onChange}
                                    placeholder={"https://soundcloud.com/xyz"}
                                    description={"Enter a song URL"}
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
