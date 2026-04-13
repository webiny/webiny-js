import React, { useMemo } from "react";
import { useContainer } from "@webiny/app";
import { PageType } from "webiny/admin/website-builder";

export default () => {
    const container = useContainer();

    useMemo(() => {
        container.registerInstance(PageType, {
            name: "retailPage",
            label: "Retail Page"
        });

        container.registerInstance(PageType, {
            name: "restaurantPage",
            label: "Restaurant Page"
        });
    }, []);

    return null;
};
