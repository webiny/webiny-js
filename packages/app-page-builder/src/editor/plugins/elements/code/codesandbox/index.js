// @flow
import React from "react";
import styled from "@emotion/styled";
import { Tab } from "@webiny/ui/Tabs";
import { Input } from "@webiny/ui/Input";
import { Grid, Cell } from "@webiny/ui/Grid";
import { ReactComponent as CodeIcon } from "./../../../elementGroups/code/code.svg";
import type { PluginType } from "@webiny/app-page-builder/types";
import {
    createEmbedPlugin,
    createEmbedSettingsPlugin
} from "./../../utils/oembed/createEmbedPlugin";

import { ReactComponent as LogoIcon } from "./codesandbox-logo.svg";

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
        type: "codesandbox",
        toolbar: {
            title: "CodeSandbox",
            group: "pb-editor-element-group-code",
            preview() {
                return (
                    <PreviewBox>
                        <LogoIcon />
                    </PreviewBox>
                );
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
                            <Bind name={"source.url"} validators={["required", "url"]}>
                                <Input
                                    label={"CodeSandbox URL"}
                                    description={"Enter a CodeSandbox URL"}
                                />
                            </Bind>
                        </Cell>
                    </Grid>
                </Tab>
            );
        }
    })
];
