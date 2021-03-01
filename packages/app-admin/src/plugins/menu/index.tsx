import React from "react";
import Hamburger from "./Hamburger";
import { AdminHeaderLeftPlugin } from "../../types";

const plugin = [
    {
        name: "admin-header-main-menu-icon",
        type: "admin-header-left",
        render() {
            return <Hamburger />;
        }
    } as AdminHeaderLeftPlugin
];

export default plugin;
