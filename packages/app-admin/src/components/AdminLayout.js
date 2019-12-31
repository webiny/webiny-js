// @flow
import * as React from "react";
import { renderPlugins } from "@webiny/app/plugins";

export const AdminLayout = ({ children }: { children: React.ReactNode }) => {
    return <React.Fragment>{renderPlugins("layout", { content: children })}</React.Fragment>;
};
