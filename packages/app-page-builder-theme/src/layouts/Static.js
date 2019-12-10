import React, { useMemo } from "react";
import { Addons } from "@webiny/app/components";
import { getPlugins } from "@webiny/plugins";

const Static = ({ children }) => {
    const { header: Header, footer: Footer } = useMemo(() => {
        return getPlugins("pb-layout-component").reduce((acc, item) => {
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
