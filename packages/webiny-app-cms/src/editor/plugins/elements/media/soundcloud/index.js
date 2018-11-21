// @flow
import React from "react";
import { Tab } from "webiny-ui/Tabs";
import { Input } from "webiny-ui/Input";
import { Grid, Cell } from "webiny-ui/Grid";
import type { ElementPluginType } from "webiny-app-cms/types";
import { createEmbedPlugin, createEmbedSettingsPlugin } from "./../../utils/oembed/createEmbedPlugin";
import { ReactComponent as MediaIcon } from "./../../../elementGroups/media/round-music_video-24px.svg";

export default (): Array<ElementPluginType> => [
    createEmbedPlugin({
        type: "soundcloud",
        toolbar: {
            title: "Soundcloud",
            group: "cms-element-group-media",
            preview() {
                return <span>A soundcloud sample</span>;
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
                            <Bind name={"data.source.url"} validators={["required", "url"]}>
                                <Input label={"Song URL"} description={"Enter a song URL"} />
                            </Bind>
                        </Cell>
                    </Grid>
                </Tab>
            );
        }
    })
];
