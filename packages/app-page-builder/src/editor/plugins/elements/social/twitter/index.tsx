import React from "react";
import styled from "@emotion/styled";
import kebabCase from "lodash/kebabCase";
import { Typography } from "@webiny/ui/Typography";
import { validation } from "@webiny/validation";
import { createEmbedPlugin, createEmbedSettingsPlugin } from "../../utils/oembed";
import placeholder from "./placeholder.jpg";
import { ReactComponent as LogoIcon } from "./twitter-brands.svg";
import Accordion from "../../../elementSettings/components/Accordion";
import InputField from "../../../elementSettings/components/InputField";
import {
    ButtonContainer,
    SimpleButton
} from "../../../elementSettings/components/StyledComponents";
import { PbEditorElementPluginArgs } from "~/types";
import { PeTwitter } from "./PeTwitter";

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

export default (args: PbEditorElementPluginArgs = {}) => {
    const elementType = kebabCase(args.elementType || "twitter");
    const defaultToolbar = {
        title: "Tweet",
        group: "pb-editor-element-group-social",
        preview() {
            return (
                <PreviewBox>
                    <LogoIcon />
                </PreviewBox>
            );
        }
    };

    return [
        createEmbedPlugin({
            type: elementType,
            /**
             * TODO @ts-refactor @ashutosh
             * Completely different types between method result and variable
             */
            // @ts-expect-error
            toolbar:
                typeof args.toolbar === "function" ? args.toolbar(defaultToolbar) : defaultToolbar,
            create: args.create,
            // @ts-expect-error
            settings: args.settings,
            oembed: {
                global: "twttr",
                sdk: "https://platform.twitter.com/widgets.js",
                init({ node }) {
                    window.twttr.widgets.load(node);
                }
            },
            renderElementPreview({ width, height }) {
                return <img style={{ width, height }} src={placeholder} alt={"Tweet"} />;
            },
            render(props) {
                // @ts-expect-error No need to worry about different element.elements type.
                return <PeTwitter {...props} />;
            }
        }),
        createEmbedSettingsPlugin({
            type: elementType,
            render({ Bind, submit }) {
                return (
                    <Accordion title={"Twitter"} defaultValue={true}>
                        <>
                            <Bind
                                name={"source.url"}
                                validators={validation.create("required,url")}
                            >
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
};
