// @flow
import React from "react";
import Button from "./Button";
import { createValue } from "webiny-app-cms/editor/components/Slate";
import type { ElementPluginType } from "webiny-app-cms/types";
import { Tab } from "webiny-ui/Tabs";
import { ReactComponent as ButtonIcon } from "./round-category-24px.svg";
import ButtonSettings from "./ButtonSettings";

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
            render(props) {
                return (
                    <Tab icon={<ButtonIcon />} label="Button">
                        <ButtonSettings {...props}/>
                    </Tab>
                );
            }
        }
    ];
};
