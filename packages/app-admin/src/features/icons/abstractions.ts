import React from "react";
import { createAbstraction } from "@webiny/feature/admin";

export type IconComponent = React.ComponentType<React.SVGProps<SVGSVGElement>>;

/**
 * A small DI-backed registry that maps a string key to an icon React component. Features
 * (and users) that only know an icon by name — e.g. a code-based `CmsBulkAction` declaring
 * `icon = "discount"` — resolve the actual SVG component through this registry, instead of
 * importing it directly. Unknown keys resolve to `undefined` (with a dev-only warning).
 */
export interface IIconRegistry {
    register(key: string, component: IconComponent): void;
    get(key: string): IconComponent | undefined;
}

export const IconRegistry = createAbstraction<IIconRegistry>("IconRegistry");

export namespace IconRegistry {
    export type Interface = IIconRegistry;
    export type Component = IconComponent;
}
