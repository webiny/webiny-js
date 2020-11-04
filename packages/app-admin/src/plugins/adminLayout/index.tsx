import React from "react";
import { Header } from "./Header";
import { Content } from "./Content";
import { AdminLayoutComponentPlugin } from "../../types";

const plugin: AdminLayoutComponentPlugin = {
    type: "admin-layout-component",
    render({ content }) {
        return (
            <>
                <Header />
                <Content>{content}</Content>
            </>
        );
    }
};

export default plugin;
