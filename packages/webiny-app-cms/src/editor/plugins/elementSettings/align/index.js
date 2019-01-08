//@flow
import React from "react";
import Action from "../components/Action";
import HorizontalAlignAction from "./HorizontalAlignAction";
import HorizontalAlignFlexAction from "./HorizontalAlignFlex";
import VerticalAlignAction from "./VerticalAlignAction";

export default [
    {
        name: "cms-element-settings-horizontal-align",
        type: "cms-element-settings",
        renderAction({ options }: Object) {
            return (
                <HorizontalAlignAction options={options}>
                    <Action plugin={this.name} tooltip={"Horizontal align"} />
                </HorizontalAlignAction>
            );
        }
    },
    {
        name: "cms-element-settings-horizontal-align-flex",
        type: "cms-element-settings",
        renderAction() {
            return (
                <HorizontalAlignFlexAction>
                    <Action plugin={this.name} tooltip={"Horizontal align"} />
                </HorizontalAlignFlexAction>
            );
        }
    },
    {
        name: "cms-element-settings-vertical-align",
        type: "cms-element-settings",
        renderAction() {
            return (
                <VerticalAlignAction>
                    <Action plugin={this.name} tooltip={"Vertical align"} />
                </VerticalAlignAction>
            );
        }
    }
];
