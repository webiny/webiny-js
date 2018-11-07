// @flow
import React from "react";
import Button from "./Button";
import { createValue } from "webiny-app-cms/editor/components/Slate";
import { Select } from "webiny-ui/Select";
import { Input } from "webiny-ui/Input";
import { Switch } from "webiny-ui/Switch";
import { Grid, Cell } from "webiny-ui/Grid";
import { Tab } from "webiny-ui/Tabs";
import { ReactComponent as ButtonIcon } from "./round-category-24px.svg";
import type { ElementPluginType } from "webiny-app-cms/types";

export default (): ElementPluginType => {
    return [
        {
            name: "cms-element-button",
            type: "cms-element",
            toolbar: {
                title: "Button",
                group: "cms-element-group-text",
                preview() {
                    return <button className={"webiny-cms-element-button"}>Click me</button>;
                }
            },
            settings: [
                "cms-element-settings-background",
                "",
                "cms-element-settings-border",
                "cms-element-settings-shadow",
                "",
                "cms-element-settings-padding",
                "cms-element-settings-margin",
                "",
                "cms-element-settings-clone",
                "cms-element-settings-delete",
                ""
            ],
            target: ["cms-element-column", "cms-element-row"],
            create(options) {
                return {
                    type: "cms-element-button",
                    elements: [],
                    data: { text: createValue("Click me", "button") },
                    ...options
                };
            },
            render(props) {
                return <Button {...props} />;
            }
        },
        {
            name: "cms-element-advanced-button",
            type: "cms-element-advanced-settings",
            element: "cms-element-button",
            render({ Bind, theme }) {
                const { types } = theme.elements.button;

                return (
                    <Tab icon={<ButtonIcon />} label="Button">
                        <Grid>
                            <Cell span={12}>
                                <Bind name={"settings.advanced.type"} defaultValue={""}>
                                    <Select description={"Button type"}>
                                        {types.map(type => (
                                            <option key={type.className} value={type.className}>
                                                {type.label}
                                            </option>
                                        ))}
                                    </Select>
                                </Bind>
                            </Cell>
                        </Grid>
                        <Grid>
                            <Cell span={12}>
                                <Bind
                                    name={"settings.advanced.href"}
                                    defaultValue={""}
                                    validators={["url"]}
                                >
                                    <Input description={"On click, go to this URL."} />
                                </Bind>
                            </Cell>
                        </Grid>
                        <Grid>
                            <Cell span={12}>
                                <Bind name={"settings.advanced.newTab"} defaultValue={false}>
                                    <Switch description={"New tab"} />
                                </Bind>
                            </Cell>
                        </Grid>
                    </Tab>
                );
            }
        }
    ];
};
