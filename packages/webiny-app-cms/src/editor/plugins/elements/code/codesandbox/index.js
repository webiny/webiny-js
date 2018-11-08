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
        type: "codesandbox",
        toolbar: {
            title: "CodeSandbox",
            group: "cms-element-group-code",
            preview() {
                return <span>A CodeSandbox sample</span>;
            }
        },
        oembed: {
            onData(data) {
                data.html = data.html.replace(/1000px/g, "100%").replace(/1000/g, "100%");
                return data;
            }
        }
    }),
    createEmbedSettingsPlugin({
        type: "codesandbox",
        render({ Bind }) {
            return (
                <Tab icon={<CodeIcon />} label="CodeSandbox">
                    <Grid>
                        <Cell span={12}>
                            <Bind name={"data.source.url"} validators={["required", "url"]}>
                                <Input label={"CodeSandbox URL"} description={"Enter a CodeSandbox URL"} />
                            </Bind>
                        </Cell>
                    </Grid>
                </Tab>
            );
        }
    })
];
