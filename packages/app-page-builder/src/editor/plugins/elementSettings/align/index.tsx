import React from "react";
import Action from "../components/Action";
import HorizontalAlignAction from "./HorizontalAlignAction";
import HorizontalAlignFlexAction from "./HorizontalAlignFlex";
import VerticalAlignAction from "./VerticalAlignAction";
import { PbPageElementSettingsPlugin } from "@webiny/app-page-builder/admin/types";

export default [
    {
        name: "pb-page-element-settings-horizontal-align",
        type: "pb-page-element-settings",
        renderAction({ options }) {
            return (
                <HorizontalAlignAction options={options}>
                    <Action plugin={this.name} tooltip={"Horizontal align"} />
                </HorizontalAlignAction>
            );
        }
    } as PbPageElementSettingsPlugin,
    {
        name: "pb-page-element-settings-horizontal-align-flex",
        type: "pb-page-element-settings",
        renderAction() {
            return (
                <HorizontalAlignFlexAction>
                    <Action plugin={this.name} tooltip={"Horizontal align"} />
                </HorizontalAlignFlexAction>
            );
        }
    } as PbPageElementSettingsPlugin,
    {
        name: "pb-page-element-settings-vertical-align",
        type: "pb-page-element-settings",
        renderAction() {
            return (
                <VerticalAlignAction>
                    <Action plugin={this.name} tooltip={"Vertical align"} />
                </VerticalAlignAction>
            );
        }
    } as PbPageElementSettingsPlugin
];
