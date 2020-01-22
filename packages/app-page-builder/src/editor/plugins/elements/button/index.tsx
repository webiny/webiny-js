import React from "react";
import { css } from "emotion";
import { createValue } from "@webiny/app-page-builder/editor/components/Slate";
import { PbEditorPageElementPlugin, PbEditorPageElementSettingsPlugin } from "@webiny/app-page-builder/admin/types";
import { ReactComponent as ButtonIcon } from "./round-toggle_on-24px.svg";
import ButtonSettings from "./ButtonSettings";
import Button from "./Button";
import Action from "../../elementSettings/components/Action";

const buttonWrapper = css({
    display: "flex",
    justifyContent: "center"
});

export default () => {
    return [
        {
            name: "pb-editor-page-element-button",
            type: "pb-editor-page-element",
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
                "pb-editor-page-element-settings-button",
                "pb-editor-page-element-settings-link",
                "",
                "pb-editor-page-element-settings-horizontal-align-flex",
                "",
                "pb-editor-page-element-settings-clone",
                "pb-editor-page-element-settings-delete",
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
            render({ element }) {
                return <Button element={element} />;
            }
        } as PbEditorPageElementPlugin,
        {
            name: "pb-editor-page-element-settings-button",
            type: "pb-editor-page-element-settings",
            renderAction() {
                return <Action plugin={this.name} tooltip={"Button"} icon={<ButtonIcon />} />;
            },
            renderMenu() {
                return <ButtonSettings />;
            }
        } as PbEditorPageElementSettingsPlugin
    ];
};
