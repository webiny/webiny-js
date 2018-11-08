// @flow
import React from "react";
import { Tab } from "webiny-ui/Tabs";
import { Input } from "webiny-ui/Input";
import { Grid, Cell } from "webiny-ui/Grid";
import { ReactComponent as CodeIcon } from "./../../../elementGroups/code/code.svg";
import type { ElementPluginType } from "webiny-app-cms/types";
import { createEmbedPlugin, createEmbedSettingsPlugin } from "./../../utils/oembed/createEmbedPlugin";

export default (): Array<ElementPluginType> => [
    createEmbedPlugin({
        type: "codepen",
        toolbar: {
            title: "CodePen",
            group: "cms-element-group-code",
            preview() {
                return <span>A CodePen sample</span>;
            }
        }
    }),
    createEmbedSettingsPlugin({
        type: "codepen",
        render({ Bind }) {
            return (
                <Tab icon={<CodeIcon />} label="CodePen">
                    <Grid>
                        <Cell span={12}>
                            <Bind name={"data.source.url"} validators={["required", "url"]}>
                                <Input label={"CodePen URL"} description={"Enter a CodePen URL"} />
                            </Bind>
                        </Cell>
                    </Grid>
                </Tab>
            );
        }
    })
];
