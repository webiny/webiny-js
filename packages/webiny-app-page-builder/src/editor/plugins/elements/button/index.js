// @flow
import React from "react";
import { createValue } from "webiny-app-page-builder/editor/components/Slate";
import type { PluginType } from "webiny-app-page-builder/types";
import { ReactComponent as ButtonIcon } from "./round-toggle_on-24px.svg";
import ButtonSettings from "./ButtonSettings";
import Button from "./Button";
import Action from "../../elementSettings/components/Action";
import { css } from "emotion";

const buttonWrapper = css({
    display: "flex",
    justifyContent: "center"
});

export default (): Array<PluginType> => {
    return [
        {
            name: "pb-page-element-button",
            type: "pb-page-element",
            elementType: "button",
            toolbar: {
                title: "Button",
                group: "pb-editor-element-group-basic",
                preview() {
                    return (
                        <div className={buttonWrapper}>
                            <button className={"webiny-pb-page-element-button"}>Click me</button>
                        </div>
                    );
                }
            },
            settings: [
                "pb-page-element-settings-button",
                "pb-page-element-settings-link",
                "",
                "pb-page-element-settings-horizontal-align-flex",
                "",
                "pb-page-element-settings-clone",
                "pb-page-element-settings-delete",
                ""
            ],
            target: ["column", "row"],
            create(options) {
                return {
                    type: "button",
                    elements: [],
                    data: {
                        text: createValue("Click me", "button"),
                        settings: {
                            margin: {
                                desktop: { all: 0 },
                                mobile: { all: 0 }
                            },
                            padding: {
                                desktop: { all: 0 },
                                mobile: { all: 0 }
                            }
                        }
                    },
                    ...options
                };
            },
            render({ element }: Object) {
                return <Button element={element} />;
            }
        },
        {
            name: "pb-page-element-settings-button",
            type: "pb-page-element-settings",
            renderAction() {
                return <Action plugin={this.name} tooltip={"Button"} icon={<ButtonIcon />} />;
            },
            renderMenu() {
                return <ButtonSettings />;
            }
        }
    ];
};
