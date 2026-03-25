import React from "react";
import { PageListConfig } from "webiny/admin/website-builder/page/list";
import { FunnelPageForm } from "./FunnelPageForm.js";

export default () => {
    return (
        <PageListConfig>
            <PageListConfig.PageType name={"static"} remove />
            <PageListConfig.PageType
                name={"funnel"}
                label={"Funnel"}
                element={<FunnelPageForm />}
            />
        </PageListConfig>
    );
};
