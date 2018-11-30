// @flow
import React from "react";
import { createValue } from "webiny-app-cms/editor/components/Slate";
import type { ElementPluginType } from "webiny-app-cms/types";
import { ReactComponent as ButtonIcon } from "./round-toggle_on-24px.svg";
import { ReactComponent as LinkIcon } from "./round-link-24px.svg";
import ButtonSettings from "./ButtonSettings";
import LinkSettings from "./LinkSettings";
import Button from "./Button";
import Action from "../../elementSettings/components/Action";

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
                "cms-element-settings-button",
                "cms-element-settings-icon",
                "cms-element-settings-link",
                "",
                "cms-element-settings-background",
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
            render({ element }: Object) {
                return <Button element={element} />;
            }
        },
        {
            name: "cms-element-settings-button",
            type: "cms-element-settings",
            renderAction() {
                return <Action plugin={this.name} tooltip={"Button"} icon={<ButtonIcon />} />;
            },
            renderMenu() {
                return <ButtonSettings />;
            }
        },
        {
            name: "cms-element-settings-link",
            type: "cms-element-settings",
            renderAction() {
                return <Action plugin={this.name} tooltip={"Link"} icon={<LinkIcon />} />;
            },
            renderMenu() {
                return <LinkSettings />;
            }
        }
    ];
};
