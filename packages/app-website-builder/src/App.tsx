import React from "react";
import { PageModelProviderModule } from "~/features/pages/index.js";
import { PagesConfig } from "~/pages/PagesConfig.js";

export const WebsiteBuilder = () => {
    return (
        <>
            <PageModelProviderModule />
            <PagesConfig />
        </>
    );
};
