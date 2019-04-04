// @flow
import React from "react";
import styled from "react-emotion";
import { Tab } from "webiny-ui/Tabs";
import { Input } from "webiny-ui/Input";
import { Grid, Cell } from "webiny-ui/Grid";
import { ReactComponent as CodeIcon } from "./round-text_format-24px.svg";
import { ReactComponent as TypeformLogo } from "./typeform-logo.svg";
import { ElementRoot } from "webiny-app-cms/render/components/ElementRoot";
import TypeFormEmbed from "./TypeFormEmbed";
import render from "./../render";

const PreviewBox = styled("div")({
    textAlign: "center",
    height: 150,
    svg: {
        height: 150,
        width: 150
    }
});

export default [
    ...render,
    {
        name: "cms-element-typeform",
        type: "cms-element",
        toolbar: {
            title: "Typeform",
            group: "cms-element-group-form",
            preview() {
                return (
                    <PreviewBox>
                        <TypeformLogo />
                    </PreviewBox>
                );
            }
        },
        settings: ["cms-element-settings-delete", "", "cms-element-settings-height"],
        target: ["cms-element-column", "cms-element-row", "cms-element-list-item"],
        onCreate: "open-settings",
        render({ element }: Object) {
            return (
                <ElementRoot element={element} className={"webiny-cms-element-typeform"}>
                    <TypeFormEmbed elementId={element.id} />
                </ElementRoot>
            );
        },
        create() {
            return {
                type: "cms-element-typeform",
                elements: [],
                data: {},
                settings: {
                    style: {
                        height: "500px"
                    }
                }
            };
        }
    },
    {
        name: "cms-element-advanced-settings-typeform",
        type: "cms-element-advanced-settings",
        element: "cms-element-typeform",
        render({ Bind }: Object) {
            return (
                <Tab icon={<CodeIcon />} label="Typeform">
                    <Grid>
                        <Cell span={12}>
                            <Bind name={"data.source.url"} validators={["required", "url"]}>
                                <Input
                                    label={"Typeform URL"}
                                    description={"Enter a Typeform URL"}
                                />
                            </Bind>
                        </Cell>
                    </Grid>
                </Tab>
            );
        }
    }
];
