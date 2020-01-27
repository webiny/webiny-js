import React from "react";
import styled from "@emotion/styled";
import { ContentPlugin, LayoutPlugin, EmptyLayoutPlugin } from "@webiny/app-admin/types";

const AdminLayoutRoot = styled("div")({
    width: "100%",
    paddingTop: 67
});

const EmptyLayoutRoot = styled("div")({
    width: "100%",
    paddingTop: 67
});

const plugins: ContentPlugin[] = [
    {
        name: "admin-layout-content",
        type: "layout",
        render({ content }) {
            return <AdminLayoutRoot>{content}</AdminLayoutRoot>;
        }
    } as LayoutPlugin,
    {
        name: "empty-layout-content",
        type: "empty-layout",
        render({ content }) {
            return <EmptyLayoutRoot>{content}</EmptyLayoutRoot>;
        }
    } as EmptyLayoutPlugin
];

export default plugins;
