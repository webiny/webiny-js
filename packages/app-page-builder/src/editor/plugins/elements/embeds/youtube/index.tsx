import React from "react";
import styled from "@emotion/styled";
import { validation } from "@webiny/validation";
import { Typography } from "@webiny/ui/Typography";
import { createEmbedSettingsPlugin, createEmbedPlugin } from "../../utils/oembed";
import YoutubeEmbed from "./YoutubeEmbed";
import placeholder from "./placeholder.png";
import { ReactComponent as LogoIcon } from "./youtube-brands.svg";
import Accordion from "../../../elementSettings/components/Accordion";
import InputField from "../../../elementSettings/components/InputField";
import { SimpleButton } from "../../../elementSettings/components/StyledComponents";
import { OnCreateActions, PbEditorElementPluginArgs } from "~/types";
import kebabCase from "lodash/kebabCase";
import { EmbedPluginConfigRenderCallable } from "~/editor/plugins/elements/utils/oembed/createEmbedPlugin";

import { PElementsYouTube } from "./PElementsYouTube";

const PreviewBox = styled("div")({
    textAlign: "center",
    height: 50,
    svg: {
        height: 50,
        width: 50
    }
});

const ButtonContainer = styled("div")({
    marginTop: 16
});

const render: EmbedPluginConfigRenderCallable = props => (
    // @ts-expect-error Sync `elements` property type.
    <PElementsYouTube {...props} />
);

export default (args: PbEditorElementPluginArgs = {}) => {
    const elementType = kebabCase(args.elementType || "youtube");
    const defaultToolbar = {
        title: "Youtube",
        group: "pb-editor-element-group-embeds",
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
             */
            // @ts-expect-error
            toolbar:
                typeof args.toolbar === "function" ? args.toolbar(defaultToolbar) : defaultToolbar,
            create: args.create,
            // @ts-expect-error
            settings: args.settings,
            onCreate: OnCreateActions.OPEN_SETTINGS,
            oembed: {
                renderEmbed(props) {
                    return <YoutubeEmbed {...props} />;
                }
            },
            renderElementPreview({ width, height }) {
                return <img style={{ width, height }} src={placeholder} alt={"Youtube"} />;
            },
            render
        }),
        createEmbedSettingsPlugin({
            type: elementType,
            render({ Bind, submit }) {
                return (
                    <Accordion title={"YouTube"} defaultValue={true}>
                        <>
                            <Bind
                                name={"source.url"}
                                validators={validation.create("required,url")}
                            >
                                <InputField
                                    placeholder={"https://youtube.com/watch?v=4qcDLzu8kVM"}
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
};
