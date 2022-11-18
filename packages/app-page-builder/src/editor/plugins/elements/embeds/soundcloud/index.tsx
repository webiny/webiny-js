import React from "react";
import styled from "@emotion/styled";
import kebabCase from "lodash/kebabCase";
import { Typography } from "@webiny/ui/Typography";
import { validation } from "@webiny/validation";
import { createEmbedPlugin, createEmbedSettingsPlugin } from "../../utils/oembed";
import { ReactComponent as LogoIcon } from "./soundcloud-brands.svg";
import Accordion from "../../../elementSettings/components/Accordion";
import InputField from "../../../elementSettings/components/InputField";
import {
    ButtonContainer,
    SimpleButton
} from "../../../elementSettings/components/StyledComponents";
import { PbEditorElementPluginArgs } from "../../../../../types";

const PreviewBox = styled("div")({
    textAlign: "center",
    height: 50,
    svg: {
        height: 50,
        width: 50
    }
});

export default (args: PbEditorElementPluginArgs = {}) => {
    const elementType = kebabCase(args.elementType || "soundcloud");
    const defaultToolbar = {
        title: "Soundcloud",
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
            // @ts-ignore
            toolbar:
                typeof args.toolbar === "function" ? args.toolbar(defaultToolbar) : defaultToolbar,
            settings: args.settings,
            create: args.create
        }),
        createEmbedSettingsPlugin({
            type: elementType,
            render({ Bind, submit }) {
                return (
                    <Accordion title={"SoundCloud"} defaultValue={true}>
                        <>
                            <Bind
                                name={"source.url"}
                                validators={validation.create("required,url")}
                            >
                                <InputField
                                    placeholder={"https://soundcloud.com/xyz"}
                                    description={"Enter a song URL"}
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
