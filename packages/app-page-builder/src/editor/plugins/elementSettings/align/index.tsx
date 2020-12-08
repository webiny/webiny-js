import React from "react";
import Action from "../components/Action";
import HorizontalAlignAction from "./HorizontalAlignAction";
import HorizontalAlignFlexAction from "./HorizontalAlignFlex";
import VerticalAlignAction from "./VerticalAlignAction";
import { PbEditorPageElementSettingsPlugin } from "@webiny/app-page-builder/types";

export default [
    {
        name: "pb-editor-page-element-settings-horizontal-align",
        type: "pb-editor-page-element-settings",
        renderAction({ options }) {
            return (
                <HorizontalAlignAction options={options}>
                    <Action plugin={this.name} tooltip={"Horizontal align"} />
                </HorizontalAlignAction>
            );
        }
    } as PbEditorPageElementSettingsPlugin,
    {
        name: "pb-editor-page-element-settings-horizontal-align-flex",
        type: "pb-editor-page-element-settings",
        renderAction() {
            return (
                <HorizontalAlignFlexAction>
                    <Action plugin={this.name} tooltip={"Horizontal align"} />
                </HorizontalAlignFlexAction>
            );
        }
    } as PbEditorPageElementSettingsPlugin,
    {
        name: "pb-editor-page-element-settings-vertical-align",
        type: "pb-editor-page-element-settings",
        renderAction() {
            return (
                <VerticalAlignAction>
                    <Action plugin={this.name} tooltip={"Vertical align"} />
                </VerticalAlignAction>
            );
        }
    } as PbEditorPageElementSettingsPlugin
];
