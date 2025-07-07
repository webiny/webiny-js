import React, { useState } from "react";
import { StaticPageForm } from "./StaticPageForm";

export type PageType = {
    name: string;
    label: string;
    element: React.ReactNode;
};

const pageTypes: Map<string, PageType> = new Map();

pageTypes.set("static", {
    name: "static",
    label: "Static Page",
    element: <StaticPageForm />
});

export const usePageTypes = () => {
    const [, setCount] = useState(0);

    const addPageType = (pageType: PageType) => {
        pageTypes.set(pageType.name, pageType);
        setCount(count => count + 1);
    };

    return { pageTypes, addPageType };
};
