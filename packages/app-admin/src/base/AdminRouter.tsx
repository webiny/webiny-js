import React, { useCallback } from "react";
import type { History } from "history";
import { useTenancy } from "@webiny/app-tenancy";
import { BrowserRouter } from "@webiny/react-router";

export const AdminRouter = ({
    history,
    children
}: {
    history: History;
    children: React.ReactElement;
}) => {
    const { tenant } = useTenancy();

    const getBasename = useCallback(() => {
        if (tenant === "root") {
            return "/";
        }
        return tenant ? `/t_${tenant}` : undefined;
    }, [tenant]);

    return (
        <BrowserRouter history={history} getBasename={getBasename}>
            {children}
        </BrowserRouter>
    );
};
