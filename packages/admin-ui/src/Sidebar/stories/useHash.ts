import { useState, useEffect } from "react";

/**
 * A hook that returns the current URL hash and updates
 * whenever it changes (via hashchange event or popstate).
 *
 * @returns The current hash value
 */
export const useHash = (): string => {
    const getHash = () => {
        return window.location.hash;
    };

    const [hash, setHash] = useState<string>(getHash);

    useEffect(() => {
        const handleHashChange = () => {
            setHash(getHash());
        };

        // Listen for hash changes (including from our Link component)
        window.addEventListener("hashchange", handleHashChange);

        // Also listen for popstate (back/forward navigation)
        window.addEventListener("popstate", handleHashChange);

        return () => {
            window.removeEventListener("hashchange", handleHashChange);
            window.removeEventListener("popstate", handleHashChange);
        };
    }, []);

    return hash;
};
