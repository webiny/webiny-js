// @flow
import React from "react";
import { Tab } from "webiny-ui/Tabs";
import { Input } from "webiny-ui/Input";
import { Grid, Cell } from "webiny-ui/Grid";
import { ReactComponent as SocialIcon } from "./../../../elementGroups/social/round-people-24px.svg";
import type { ElementPluginType } from "webiny-app-cms/types";
import {
    createEmbedPlugin,
    createEmbedSettingsPlugin
} from "./../../utils/oembed/createEmbedPlugin";

export default (): Array<ElementPluginType> => [
    createEmbedPlugin({
        type: "instagram",
        toolbar: {
            title: "Instagram",
            group: "cms-element-group-social",
            preview() {
                return <span>An instagram sample</span>;
            }
        },
        oembed: {
            global: "instgrm",
            sdk: "https://www.instagram.com/embed.js",
            init({ node }) {
                window.instgrm.Embeds.process(node.firstChild);
            }
        }
    }),
    createEmbedSettingsPlugin({
        type: "instagram",
        render({ Bind }) {
            return (
                <Tab icon={<SocialIcon />} label="Instagram">
                    <Grid>
                        <Cell span={12}>
                            <Bind name={"data.source.url"} validators={["required", "url"]}>
                                <Input
                                    label={"Instagram URL"}
                                    description={"Enter an Instagram URL"}
                                />
                            </Bind>
                        </Cell>
                    </Grid>
                </Tab>
            );
        }
    })
];
