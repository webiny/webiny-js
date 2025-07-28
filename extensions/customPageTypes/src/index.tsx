import React from "react";
import { PageListConfig } from "@webiny/app-website-builder";
import { RetailPageForm } from "./RetailPageForm";

export const Extension = () => {
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
