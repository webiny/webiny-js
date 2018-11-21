// @flow
import React from "react";
import type { ElementPluginType } from "webiny-app-cms/types";
import { Tab } from "webiny-ui/Tabs";
import { Input } from "webiny-ui/Input";
import { Grid, Cell } from "webiny-ui/Grid";
import { ReactComponent as SocialIcon } from "./../../../elementGroups/social/round-people-24px.svg";
import {
    createEmbedPlugin,
    createEmbedSettingsPlugin
} from "./../../utils/oembed/createEmbedPlugin";

export default (): Array<ElementPluginType> => [
    createEmbedPlugin({
        type: "twitter",
        toolbar: {
            title: "Twitter",
            group: "cms-element-group-social",
            preview() {
                return <span>A tweet sample</span>;
            }
        },
        oembed: {
            global: "twttr",
            sdk: "https://platform.twitter.com/widgets.js",
            init({ node }) {
                window.twttr.widgets.load(node);
            }
        }
    }),
    createEmbedSettingsPlugin({
        type: "twitter",
        render({ Bind }) {
            return (
                <Tab icon={<SocialIcon />} label="Twitter">
                    <Grid>
                        <Cell span={12}>
                            <Bind name={"data.source.url"} validators={["required", "url"]}>
                                <Input label={"Tweet URL"} description={"Enter a Tweet URL"} />
                            </Bind>
                        </Cell>
                    </Grid>
                </Tab>
            );
        }
    })
];
