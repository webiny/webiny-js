import React from "react";
import { renderPlugins } from "@webiny/app/plugins";
import { TopAppBarPrimary, TopAppBarSection } from "@webiny/ui/TopAppBar";
import { css } from "emotion";
import {
    AdminHeaderLeftPlugin,
    AdminHeaderMiddlePlugin,
    AdminHeaderRightPlugin
} from "@webiny/app-admin/types";

const middleBar = css({
    width: "50%"
});

const edgeBars = css({
    width: "25%"
});

export const Header = () => {
    return (
        <TopAppBarPrimary fixed>
            <TopAppBarSection className={edgeBars} alignStart>
                {renderPlugins<AdminHeaderLeftPlugin>("admin-header-left")}
            </TopAppBarSection>
            <TopAppBarSection className={middleBar}>
                {renderPlugins<AdminHeaderMiddlePlugin>("admin-header-middle")}
            </TopAppBarSection>
            <TopAppBarSection className={edgeBars} alignEnd>
                {renderPlugins<AdminHeaderRightPlugin>("admin-header-right", null, {
                    reverse: true
                })}
            </TopAppBarSection>
        </TopAppBarPrimary>
    );
};
