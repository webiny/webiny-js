import React from "react";
import styled from "@emotion/styled";
import { Typography } from "@webiny/ui/Typography";
import { validation } from "@webiny/validation";
import {
    createEmbedPlugin,
    createEmbedSettingsPlugin
} from "./../../utils/oembed/createEmbedPlugin";
import VimeoEmbed from "./VimeoEmbed";
import { ReactComponent as LogoIcon } from "./vimeo-v-brands.svg";
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
        type: "vimeo",
        toolbar: {
            title: "Vimeo",
            group: "pb-editor-element-group-media",
            preview() {
                return (
                    <PreviewBox>
                        <LogoIcon />
                    </PreviewBox>
                );
            }
        },
        oembed: {
            renderEmbed(props) {
                return <VimeoEmbed {...props} />;
            }
        },
        renderElementPreview() {
            return <div>Vimeo video</div>;
        }
    }),
    createEmbedSettingsPlugin({
        type: "vimeo",
        render({ Bind, submit }) {
            return (
                <Accordion title={"Vimeo"} defaultValue={true}>
                    <>
                        <Bind name={"source.url"} validators={validation.create("required,url")}>
                            <InputField
                                placeholder={"https://vimeo.com/158050352"}
                                description={"Enter a video URL"}
                            />
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
