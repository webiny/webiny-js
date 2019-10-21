import React from "react";

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

    return <ul>{renderList()}</ul>;
};

export default Sidebar;
