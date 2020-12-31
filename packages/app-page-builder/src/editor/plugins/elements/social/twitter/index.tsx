import React from "react";
import styled from "@emotion/styled";
import { Typography } from "@webiny/ui/Typography";
import { validation } from "@webiny/validation";
import {
    createEmbedPlugin,
    createEmbedSettingsPlugin
} from "./../../utils/oembed/createEmbedPlugin";
import placeholder from "./placeholder.jpg";
import { ReactComponent as LogoIcon } from "./twitter-brands.svg";
import Accordion from "../../../elementSettings/components/Accordion";
import InputField from "../../../elementSettings/components/InputField";
import {
    ButtonContainer,
    SimpleButton
} from "../../../elementSettings/components/StyledComponents";

declare global {
    interface Window {
        twttr: any;
    }
}

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
        type: "twitter",
        toolbar: {
            title: "Tweet",
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
            global: "twttr",
            sdk: "https://platform.twitter.com/widgets.js",
            init({ node }) {
                window.twttr.widgets.load(node);
            }
        },
        renderElementPreview({ width, height }) {
            return <img style={{ width, height }} src={placeholder} alt={"Tweet"} />;
        }
    }),
    createEmbedSettingsPlugin({
        type: "twitter",
        render({ Bind, submit }) {
            return (
                <Accordion title={"Twitter"} defaultValue={true}>
                    <>
                        <Bind name={"source.url"} validators={validation.create("required,url")}>
                            <InputField
                                placeholder={"https://twitter.com/"}
                                description={"Enter a Tweet URL"}
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
