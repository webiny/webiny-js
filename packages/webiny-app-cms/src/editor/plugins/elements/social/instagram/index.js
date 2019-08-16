// @flow
import React from "react";
import styled from "react-emotion";
import { Tab } from "webiny-ui/Tabs";
import { Input } from "webiny-ui/Input";
import { Grid, Cell } from "webiny-ui/Grid";
import { ReactComponent as SocialIcon } from "./../../../elementGroups/social/round-people-24px.svg";
import type { PluginType } from "webiny-app-cms/types";
import placeholder from "./placeholder.jpg";
import {
    createEmbedPlugin,
    createEmbedSettingsPlugin
} from "./../../utils/oembed/createEmbedPlugin";

import { ReactComponent as LogoIcon } from "./instagram-brands.svg";

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
        type: "instagram",
        toolbar: {
            title: "Instagram Post",
            group: "pb-page-element-group-social",
            preview() {
                return (
                    <PreviewBox>
                        <LogoIcon />
                    </PreviewBox>
                );
            }
        },
        oembed: {
            global: "instgrm",
            sdk: "https://www.instagram.com/embed.js",
            init({ node }) {
                window.instgrm.Embeds.process(node.firstChild);
            }
        },
        renderElementPreview({ width, height }) {
            return <img style={{ width, height }} src={placeholder} alt={"Instagram"} />;
        }
    }),
    createEmbedSettingsPlugin({
        type: "instagram",
        render({ Bind }) {
            return (
                <Tab icon={<SocialIcon />} label="Instagram">
                    <Grid>
                        <Cell span={12}>
                            <Bind name={"source.url"} validators={["required", "url"]}>
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
