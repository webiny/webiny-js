import React from "react";
import styled from "@emotion/styled";
import { makeDecoratable } from "@webiny/app-admin";
import { Tabs } from "@webiny/admin-ui";
import { Sidebar } from "./Sidebar";

const SidebarContainer = styled.div`
    background-color: #ffffff;
    border-left: 1px solid var(--mdc-theme-on-background);
`;

export const Layout = makeDecoratable("SidebarLayout", () => {
    return (
        <SidebarContainer>
            <Tabs
                size="md"
                spacing={"md"}
                separator={true}
                defaultValue={"element"}
                tabs={[<Sidebar.Elements group="groups" key={"groups"} />]}
            />
        </SidebarContainer>
    );
});
