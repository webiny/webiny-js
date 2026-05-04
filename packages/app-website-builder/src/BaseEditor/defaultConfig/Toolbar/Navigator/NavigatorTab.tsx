import React from "react";
import { Icon, Tabs } from "@webiny/admin-ui";
import { ReactComponent as TreeIcon } from "@webiny/icons/account_tree.svg";
import { ScrollableContainer } from "~/BaseEditor/config/Sidebar/ScrollableContainer.js";
import { Navigator } from "./Navigator.js";

export const NavigatorTab = () => {
    return (
        <Tabs.Tab
            value="navigator"
            trigger={"Navigator"}
            spacing={"sm"}
            icon={<Icon icon={<TreeIcon />} label={"Navigator"} />}
            content={
                <ScrollableContainer>
                    <Navigator />
                </ScrollableContainer>
            }
        />
    );
};
