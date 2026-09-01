import { createContext, useContext } from "react";

/**
 * Tracks how deeply nested the current object panel is. Used to compute stacking order and width -
 * a nested object opens a new panel that renders over its parent within the sidebar.
 */
export const DrawerDepthContext = createContext(0);

export const useDrawerDepth = () => useContext(DrawerDepthContext);
