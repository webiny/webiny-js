import React, { useMemo } from "react";
import { Addons } from "@webiny/app/components";
import { getPlugins } from "@webiny/plugins";
import { PbPageLayoutComponentPlugin } from "@webiny/app-page-builder/types";

const Static = ({ children }) => {
    const { header: Header, footer: Footer }: any = useMemo(() => {
        const plugins = getPlugins("pb-layout-component") as PbPageLayoutComponentPlugin[];
        return plugins.reduce((acc, item) => {
            acc[item.componentType] = item.component;
            return acc;
        }, {});
    }, []);

    return (
        <React.Fragment>
            <Addons />
            <Header />
            {children}
            <Footer />
        </React.Fragment>
    );
};

export default Static;
