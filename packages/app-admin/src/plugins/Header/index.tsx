import React from "react";
import { LayoutPlugin } from "@webiny/app-admin/types";
import Header from "./Header";

const plugin: LayoutPlugin = {
    name: "header",
    type: "layout",
    render() {
        return <Header />;
    }
};

export default plugin;
