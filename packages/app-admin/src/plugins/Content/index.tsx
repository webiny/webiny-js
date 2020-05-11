import React from "react";
import styled from "@emotion/styled";
import { AdminLayoutComponentPlugin } from "@webiny/app-admin/types";

const AdminLayoutRoot = styled("div")({
    width: "100%",
    paddingTop: 67
});

const plugins: AdminLayoutComponentPlugin[] = [
    {
        name: "admin-layout-component-content",
        type: "admin-layout-component",
        render({ content }) {
            return <AdminLayoutRoot>{content}</AdminLayoutRoot>;
        }
    }
];

export default plugins;
