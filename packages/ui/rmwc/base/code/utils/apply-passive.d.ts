/**
 * Determine whether the current browser supports passive event listeners, and
 * if so, use them.
 */
export declare function applyPassive(globalObj?: any, forceRefresh?: any): false | {
    passive: boolean;
};
