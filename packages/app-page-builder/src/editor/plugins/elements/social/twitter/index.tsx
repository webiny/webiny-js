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
import { EmbedPluginConfigRenderCallable } from "~/editor/plugins/elements/utils/oembed/createEmbedPlugin";
import { isLegacyRenderingEngine } from "~/utils";
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

let render: EmbedPluginConfigRenderCallable;
if (!isLegacyRenderingEngine) {
    render = props => (
        // @ts-ignore Sync `elements` property type.
        <PeTwitter {...props} />
    );
}

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
            // @ts-ignore
            toolbar:
                typeof args.toolbar === "function" ? args.toolbar(defaultToolbar) : defaultToolbar,
            create: args.create,
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
            render
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
