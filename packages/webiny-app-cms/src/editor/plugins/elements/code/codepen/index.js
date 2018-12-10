// @flow
import React from "react";
import styled from "react-emotion";
import { Tab } from "webiny-ui/Tabs";
import { Input } from "webiny-ui/Input";
import { Grid, Cell } from "webiny-ui/Grid";
import { ReactComponent as CodeIcon } from "./../../../elementGroups/code/code.svg";
import type { ElementPluginType } from "webiny-app-cms/types";
import {
    createEmbedPlugin,
    createEmbedSettingsPlugin
} from "./../../utils/oembed/createEmbedPlugin";

import { ReactComponent as LogoIcon } from "./codepen-brands.svg";

const PreviewBox = styled("div")({
    textAlign: "center",
    height: 50,
    svg: {
        height: 50,
        width: 50
    }
});

export default (): Array<ElementPluginType> => [
    createEmbedPlugin({
        type: "codepen",
        toolbar: {
            title: "CodePen",
            group: "cms-element-group-code",
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
