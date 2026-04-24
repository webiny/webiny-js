import React from "react";
import { makeDecoratable, OptionsMenu } from "@webiny/app-admin";
import { HeaderBar } from "@webiny/admin-ui";
import { TopBar } from "./TopBar.js";

export const Layout = makeDecoratable("TopBarLayout", () => {
    return (
        <HeaderBar
            data-role={"top-bar-layout"}
            data-affects-preview={"height"}
            start={<TopBar.Elements group={"left"} />}
            middle={<TopBar.Elements group={"center"} />}
            end={
                <div className={"flex items-center gap-sm"}>
                    <TopBar.Elements group={"actions"} />
                </div>
            }
        />
    );
});

export const TopBarOptionsMenu = () => {
    return (
        <TopBar.Elements
            group={"dropdownActions"}
            render={elements => {
                if (elements.length === 0) {
                    return null;
                }

                return <OptionsMenu actions={elements} />;
            }}
        />
    );
};
