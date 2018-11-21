// @flow
import React from "react";
import { Tab } from "webiny-ui/Tabs";
import { Input } from "webiny-ui/Input";
import { Grid, Cell } from "webiny-ui/Grid";
import type { ElementPluginType } from "webiny-app-cms/types";
import { createEmbedSettingsPlugin, createEmbedPlugin } from "./../../utils/oembed";
import { ReactComponent as MediaIcon } from "./../../../elementGroups/media/round-music_video-24px.svg";
import YoutubeEmbed from "./YoutubeEmbed";

export default (): Array<ElementPluginType> => [
    createEmbedPlugin({
        type: "youtube",
        toolbar: {
            title: "Youtube",
            group: "cms-element-group-media",
            preview() {
                return <span>A youtube sample</span>;
            }
        },
        onCreate: "open-settings",
        oembed: {
            renderEmbed(props) {
                return <YoutubeEmbed {...props} />;
            }
        }
    }),
    createEmbedSettingsPlugin({
        type: "youtube",
        render({ Bind }) {
            return (
                <Tab icon={<MediaIcon />} label="YouTube">
                    <Grid>
                        <Cell span={12}>
                            <Bind name={"data.source.url"} validators={["required", "url"]}>
                                <Input label={"Video URL"} description={"Enter a video URL"} />
                            </Bind>
                        </Cell>
                    </Grid>
                </Tab>
            );
        }
    })
];
