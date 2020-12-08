import React from "react";
import Action from "../components/Action";
import HorizontalAlignAction from "./HorizontalAlignAction";
import HorizontalAlignSettings from "./HorizontalAlignSettings";
import HorizontalAlignFlexAction from "./HorizontalAlignFlex";
import HorizontalAlignFlexSettings from "./HorizontalAlignFlexSettings";
import VerticalAlignAction from "./VerticalAlignAction";
import VerticalAlignSettings from "./VerticalAlignSettings";
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
        },
        render({ options }) {
            return <HorizontalAlignSettings options={options} />;
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
        },
        render() {
            return <HorizontalAlignFlexSettings />;
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
        },
        render() {
            return <VerticalAlignSettings />;
        }
    } as PbEditorPageElementSettingsPlugin
];
