import React from "react";
import { PageListConfig } from "webiny/admin/website-builder/page/list";

const { PageType } = PageListConfig;

export default () => {
    return (
        <PageListConfig>
            {/*<PageListConfig.PageType name={"static"} remove={true} />*/}

            <PageType
                name={"retailPage"}
                label={"Retail Page"}
                element={
                    <>
                        <PageType.Language />
                        <PageType.Title />
                        <PageType.Path />
                    </>
                }
            />

            <PageListConfig.PageType
                name={"restaurantPage"}
                label={"Restaurant Page"}
                element={
                    <>
                        <PageType.Language />
                        <PageType.Title />
                        <PageType.Path />
                    </>
                }
            />
        </PageListConfig>
    );
};
