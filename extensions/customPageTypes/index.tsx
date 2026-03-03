import React from "react";
import { PageListConfig } from "webiny/admin/website-builder/page/list";
import { RetailPageForm } from "./RetailPageForm";

export default () => {
    return (
        <PageListConfig>
            {/*<PageListConfig.PageType name={"static"} remove={true} />*/}

            <PageListConfig.PageType
                name={"retailPage"}
                label={"Retail Page"}
                element={<RetailPageForm />}
            />

            <PageListConfig.PageType
                name={"restaurantPage"}
                label={"Restaurant Page"}
                element={<RetailPageForm />}
            />
        </PageListConfig>
    );
};
