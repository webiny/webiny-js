import React from "react";
import styled from "@emotion/styled";

import { ReactComponent as WebinyLogo } from "../../assets/images/webiny-orange-logo.svg";

const SidebarWrapper = styled("div")({});

const Sidebar = ({ allInstallers, installer, showLogin }) => {
    const renderList = () => {
        const loginItem = <li key={"login"}>{showLogin && "-> "}Login Required</li>;

        const items = [];
        for (let i = 0; i < allInstallers.length; i++) {
            const { plugin, installed } = allInstallers[i];
            const prev = i === 0 ? null : allInstallers[i - 1].plugin;
            if ((!prev || !prev.secure) && plugin.secure) {
                items.push(loginItem);
            }

            let active = installer && !showLogin && plugin.name === installer.plugin.name;

            items.push(
                <li key={plugin.name}>
                    {installed && "🔵"}
                    {active && "🔴"}
                    {!installed && !active && "⚫️"}
                    {plugin.title}
                </li>
            );
        }
        return items;
    };

    return (
        <SidebarWrapper>
            <img src={WebinyLogo} alt="Webiny CMS" />
            <ul>{renderList()}</ul>
        </SidebarWrapper>
    );
};

export default Sidebar;
