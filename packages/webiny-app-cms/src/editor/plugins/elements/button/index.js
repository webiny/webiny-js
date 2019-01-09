// @flow
import React from "react";
import { createValue } from "webiny-app-cms/editor/components/Slate";
import type { PluginType } from "webiny-app-cms/types";
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
            name: "cms-element-button",
            type: "cms-element",
            toolbar: {
                title: "Button",
                group: "cms-element-group-basic",
                preview() {
                    return (
                        <div className={buttonWrapper}>
                            <button className={"webiny-cms-element-button"}>Click me</button>
                        </div>
                    );
                }
            },
            settings: [
                "cms-element-settings-button",
                "cms-element-settings-link",
                "",
                "cms-element-settings-horizontal-align-flex",
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
            name: "cms-element-settings-button",
            type: "cms-element-settings",
            renderAction() {
                return <Action plugin={this.name} tooltip={"Button"} icon={<ButtonIcon />} />;
            },
            renderMenu() {
                return <ButtonSettings />;
            }
        }
    ];
};
