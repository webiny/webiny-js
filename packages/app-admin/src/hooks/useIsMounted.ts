import { useRef, useEffect } from "react";

export const useIsMounted = () => {
    const isMountedRef = useRef(false);

    useEffect(() => {
        isMountedRef.current = true;

        return () => {
            isMountedRef.current = false;
        };
    }, []);

    return {
        isMounted: () => isMountedRef.current
    };
};
