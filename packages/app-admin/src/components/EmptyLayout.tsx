import * as React from "react";
import { renderPlugins } from "@webiny/app/plugins";

export const EmptyLayout = ({ children }: { children: React.ReactNode }) => {
    return <>{renderPlugins("empty-layout", { content: children })}</>;
};
