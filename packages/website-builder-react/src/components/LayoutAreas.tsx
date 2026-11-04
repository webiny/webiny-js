"use client";
import React, { useContext } from "react";
import type { LayoutContentArea } from "@webiny/website-builder-sdk";

export interface LayoutAreasValue {
    // What goes in the layout's Main content.
    main: React.ReactNode;
    // What goes in each named content area, by the area's name.
    areas: Record<string, React.ReactNode>;
}

const LayoutAreasContext = React.createContext<LayoutAreasValue | undefined>(undefined);

/**
 * Set while <LayoutRenderer> renders a layout around content from code (e.g. a CMS entry): its content areas
 * render that content, not a page's.
 */
export const LayoutAreasProvider = ({
    value,
    children
}: {
    value: LayoutAreasValue | undefined;
    children: React.ReactNode;
}) => {
    return <LayoutAreasContext.Provider value={value}>{children}</LayoutAreasContext.Provider>;
};

export const useLayoutAreas = () => {
    return useContext(LayoutAreasContext);
};

/**
 * The content of one area. An area with no name, or a name nothing was given for, stays empty.
 */
export const getLayoutAreaContent = (value: LayoutAreasValue, area: LayoutContentArea) => {
    if (area.isMain()) {
        return value.main;
    }

    const name = area.name();
    return name ? (value.areas[name] ?? null) : null;
};
