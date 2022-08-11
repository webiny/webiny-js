import { useCallback, useEffect, useState } from "react";
import { pingSite } from "./utils";

type UseSiteStatus = [boolean, () => void];
export const useSiteStatus = (url: string): UseSiteStatus => {
    const [active, setActive] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    const pingSiteCallback = useCallback(async () => {
        isMounted && (await pingSite({ url, cb: setActive, ignoreCache: false }));
    }, [isMounted, url]);

    useEffect(() => {
        setIsMounted(true);
        return () => {
            setIsMounted(false);
        };
    }, []);

    useEffect((): void => {
        if (!url) {
            return;
        }

        pingSiteCallback();
    }, [url, pingSiteCallback]);

    return [
        active,
        () => {
            pingSite({ url, cb: setActive, ignoreCache: true });
        }
    ];
};
