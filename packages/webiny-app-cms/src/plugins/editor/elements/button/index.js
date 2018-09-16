import React from "react";
import Button from "./Button";
import { createValue } from "webiny-app-cms/editor/components/Slate";
import { Select } from "webiny-ui/Select";
import { Input } from "webiny-ui/Input";
import { Switch } from "webiny-ui/Switch";
import { Grid, Cell } from "webiny-ui/Grid";

export default {
    name: "button",
    type: "cms-element",
    element: {
        title: "Button",
        group: "Text",
        settings: [
            "element-settings-background",
            "",
            "element-settings-border",
            "element-settings-shadow",
            "",
            "element-settings-padding",
            "element-settings-margin",
            "",
            "element-settings-clone",
            "element-settings-delete",
            "",
            "element-settings-advanced"
        ]
    },
    target: ["column", "row"],
    create(options) {
        return {
            type: "button",
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
    },
    renderSidebar({ Bind, theme }) {
        const { types } = theme.elements.button;

        return (
            <React.Fragment>
                <Grid>
                    <Cell span={12}>
                        <Bind name={"type"} defaultValue={""}>
                            <Select description={"Button type"}>
                                {types.map(type => (
                                    <option key={type.className} value={type.className}>{type.label}</option>
                                ))}
                            </Select>
                        </Bind>
                    </Cell>
                </Grid>
                <Grid>
                    <Cell span={12}>
                        <Bind name={"href"} defaultValue={""} validators={["url"]}>
                            <Input description={"On click, go to this URL."}/>
                        </Bind>
                    </Cell>
                </Grid>
                <Grid>
                    <Cell span={12}>
                        <Bind name={"newTab"} defaultValue={false}>
                            <Switch description={"New tab"}/>
                        </Bind>
                    </Cell>
                </Grid>
            </React.Fragment>
        );
    }
};
