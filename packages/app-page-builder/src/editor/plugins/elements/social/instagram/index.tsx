import React from "react";
import styled from "@emotion/styled";
import { validation } from "@webiny/validation";
import { Typography } from "@webiny/ui/Typography";
import {
    createEmbedPlugin,
    createEmbedSettingsPlugin
} from "./../../utils/oembed/createEmbedPlugin";
import placeholder from "./placeholder.jpg";
import { ReactComponent as LogoIcon } from "./instagram-brands.svg";
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
        type: "instagram",
        toolbar: {
            title: "Instagram Post",
            group: "pb-editor-element-group-social",
            preview() {
                return (
                    <PreviewBox>
                        <LogoIcon />
                    </PreviewBox>
                );
            }
        },
        oembed: {
            global: "instgrm" as keyof Window,
            sdk: "https://www.instagram.com/embed.js",
            init({ node }) {
                // @ts-expect-error
                window.instgrm.Embeds.process(node.firstChild);
            }
        },
        renderElementPreview({ width, height }) {
            return <img style={{ width, height }} src={placeholder} alt={"Instagram"} />;
        }
    }),
    createEmbedSettingsPlugin({
        type: "instagram",
        render({ Bind, submit }) {
            return (
                <Accordion title={"Instagram"} defaultValue={true}>
                    <>
                        <Bind name={"source.url"} validators={validation.create("required,url")}>
                            <InputField
                                placeholder={"https://www.instagram.com/marvel/"}
                                description={"Enter a Instagram URL"}
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
