// @flow
import React from "react";
import Button from "./Button";
import { createValue } from "webiny-app-cms/editor/components/Slate";
import { Select } from "webiny-ui/Select";
import { Input } from "webiny-ui/Input";
import { Switch } from "webiny-ui/Switch";
import { Grid, Cell } from "webiny-ui/Grid";
import type { ElementPluginType } from "webiny-app-cms/types";

export default (): ElementPluginType => {
    return [
        {
            name: "cms-element-button",
            type: "cms-element",
            element: {
                title: "Button",
                group: "cms-element-group-text",
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
                    "",
                    "cms-element-settings-advanced"
                ]
            },
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
            },
            preview() {
                return <button className={"webiny-cms-element-button"}>Click me</button>;
            }
        },
        {
            name: "cms-element-sidebar-button",
            type: "cms-element-sidebar",
            element: "cms-element-button",
            render({ Bind, theme }) {
                const { types } = theme.elements.button;

                return (
                    <React.Fragment>
                        <Grid>
                            <Cell span={12}>
                                <Bind name={"type"} defaultValue={""}>
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
                                <Bind name={"href"} defaultValue={""} validators={["url"]}>
                                    <Input description={"On click, go to this URL."} />
                                </Bind>
                            </Cell>
                        </Grid>
                        <Grid>
                            <Cell span={12}>
                                <Bind name={"newTab"} defaultValue={false}>
                                    <Switch description={"New tab"} />
                                </Bind>
                            </Cell>
                        </Grid>
                    </React.Fragment>
                );
            }
        }
    ];
};
