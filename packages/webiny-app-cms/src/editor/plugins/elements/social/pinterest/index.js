// @flow
import React from "react";
import styled from "react-emotion";
import { Tab } from "webiny-ui/Tabs";
import { Input } from "webiny-ui/Input";
import { Select } from "webiny-ui/Select";
import { Grid, Cell } from "webiny-ui/Grid";
import { ReactComponent as SocialIcon } from "./../../../elementGroups/social/round-people-24px.svg";
import type { PluginType } from "webiny-app-cms/types";
import {
    createEmbedPlugin,
    createEmbedSettingsPlugin
} from "./../../utils/oembed/createEmbedPlugin";
import PinterestEmbed from "./PinterestEmbed";

import { ReactComponent as LogoIcon } from "./pinterest-brands.svg";

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
        type: "pinterest",
        toolbar: {
            title: "Pinterest post",
            group: "cms-element-group-social",
            preview() {
                return (
                    <PreviewBox>
                        <LogoIcon />
                    </PreviewBox>
                );
            }
        },
        render({ element }) {
            return <PinterestEmbed element={element} />;
        }
    }),
    createEmbedSettingsPlugin({
        type: "pinterest",
        render({ Bind }) {
            return (
                <Tab icon={<SocialIcon />} label="Pinterest">
                    <Grid>
                        <Cell span={12}>
                            <Bind name={"source.url"} validators={["required", "url"]}>
                                <Input
                                    label={"Pinterest URL"}
                                    description={"Enter a Pinterest URL"}
                                />
                            </Bind>
                        </Cell>
                        <Cell span={12}>
                            <Bind defaultValue="small" name={"source.size"}>
                                <Select label={"Size"}>
                                    <option value="small">Small</option>
                                    <option value="medium">Medium</option>
                                    <option value="large">Large</option>
                                </Select>
                            </Bind>
                        </Cell>
                    </Grid>
                </Tab>
            );
        }
    })
];
