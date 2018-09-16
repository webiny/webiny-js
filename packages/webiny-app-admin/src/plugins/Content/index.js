//@flow
import React from "react";
import styled from "react-emotion";
import type { ContentPlugin } from "webiny-app-admin/types";

const WebinyLayoutRoot = styled("div")({
    width: "100%",
    paddingTop: 67
});

const plugin: ContentPlugin = {
    name: "content",
    type: "layout",
    render({ content }) {
        return <WebinyLayoutRoot>{content}</WebinyLayoutRoot>;
    }
};

export default plugin;
