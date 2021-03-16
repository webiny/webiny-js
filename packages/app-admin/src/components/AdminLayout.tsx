import * as React from "react";
import { renderPlugins } from "@webiny/app/plugins";
import { AdminLayoutComponentPlugin } from "../types";

export const AdminLayout = ({ children }: { children: React.ReactNode }) => {
    return (
        <>
            {renderPlugins<AdminLayoutComponentPlugin>("admin-layout-component", {
                content: children
            })}
        </>
    );
};
