//@flow
import React from "react";
import Action from "../components/Action";
import HorizontalAlignAction from "./HorizontalAlignAction";
import HorizontalAlignFlexAction from "./HorizontalAlignFlex";
import VerticalAlignAction from "./VerticalAlignAction";

export default [
    {
        name: "pb-page-element-settings-horizontal-align",
        type: "pb-page-element-settings",
        renderAction({ options }: Object) {
            return (
                <HorizontalAlignAction options={options}>
                    <Action plugin={this.name} tooltip={"Horizontal align"} />
                </HorizontalAlignAction>
            );
        }
    },
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
    },
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
    }
];
