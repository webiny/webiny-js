// @flow
import React from "react";
import styled from "react-emotion";
import { Tab } from "webiny-ui/Tabs";
import { Input } from "webiny-ui/Input";
import { Grid, Cell } from "webiny-ui/Grid";
import type { PluginType } from "webiny-app-page-builder/types";
import {
    createEmbedPlugin,
    createEmbedSettingsPlugin
} from "./../../utils/oembed/createEmbedPlugin";
import { ReactComponent as MediaIcon } from "./../../../elementGroups/media/round-music_video-24px.svg";

import { ReactComponent as LogoIcon } from "./soundcloud-brands.svg";

const PreviewBox = styled("div")({
    textAlign: "center",
    height: 50,
    svg: {
        height: 50,
        width: 50
    }
});

export default (): Array<PluginType> => [
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
        render({ Bind }) {
            return (
                <Tab icon={<MediaIcon />} label="Soundcloud">
                    <Grid>
                        <Cell span={12}>
                            <Bind name={"source.url"} validators={["required", "url"]}>
                                <Input label={"Song URL"} description={"Enter a song URL"} />
                            </Bind>
                        </Cell>
                    </Grid>
                </Tab>
            );
        }
    })
];
