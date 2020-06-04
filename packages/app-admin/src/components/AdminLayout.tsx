import * as React from "react";
import { renderPlugins } from "@webiny/app/plugins";
import { AdminLayoutComponentPlugin } from "@webiny/app-admin/types";

export const AdminLayout = ({ children }: { children: React.ReactNode }) => {
    return (
        <>
            {renderPlugins<AdminLayoutComponentPlugin>("admin-layout-component", {
                content: children
            })}
        </>
    );
};
