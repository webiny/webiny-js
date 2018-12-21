//@flow
import React from "react";
import { ReactComponent as AnimationIcon } from "./round-movie_filter-24px.svg";
import Action from "../components/Action";
import AnimationSettings from "./components/AnimationSettings";

export default {
    name: "cms-element-settings-animation",
    type: "cms-element-settings",
    renderAction() {
        return <Action tooltip={"Animation"} plugin={this.name} icon={<AnimationIcon />} />;
    },
    renderMenu() {
        return <AnimationSettings title="Animation" styleAttribute="animation" />;
    }
};
