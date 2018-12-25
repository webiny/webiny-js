import React from "react";
import Logo from "./Logo";
import { TopAppBarTitle } from "webiny-ui/TopAppBar";

export default {
    name: "header-logo",
    type: "header-left",
    render() {
        return (
            <TopAppBarTitle>
                <Logo />
            </TopAppBarTitle>
        );
    }
};
