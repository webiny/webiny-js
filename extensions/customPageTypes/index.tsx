import React from "react";
import { createFeature, RegisterFeature } from "webiny/admin";
import RetailPageType from "./RetailPageType.js";
import FilterPageTypes from "./FilterPageTypes.js";

const CustomPageTypes = createFeature({
    name: "CustomPageTypes",
    register(container) {
        // Add a new page type
        container.register(RetailPageType);

        // Remove existing page type
        container.registerDecorator(FilterPageTypes);
    }
});

export default () => {
    return <RegisterFeature feature={CustomPageTypes} />;
};
