//@flow
import React from "react";
import styled from "react-emotion";
import type { ContentPluginType } from "webiny-admin/types";

const AdminLayoutRoot = styled("div")({
    width: "100%",
    paddingTop: 67
});

const EmptyLayoutRoot = styled("div")({
    width: "100%",
    paddingTop: 67
});

export default ([
    {
        name: "admin-layout-content",
        type: "layout",
        render({ content }) {
            return <AdminLayoutRoot>{content}</AdminLayoutRoot>;
        }
    },
    {
        name: "empty-layout-content",
        type: "empty-layout",
        render({ content }) {
            return <EmptyLayoutRoot>{content}</EmptyLayoutRoot>;
        }
    }
]: Array<ContentPluginType>);
