import React from "react";
import styled from "@emotion/styled";

const AdminLayoutRoot = styled("div")({
    width: "100%",
    paddingTop: 67
});

export const Content = ({ children }) => {
    return <AdminLayoutRoot>{children}</AdminLayoutRoot>;
};
