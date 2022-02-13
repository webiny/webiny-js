import { useEffect, useState } from "react";
import { pingSite } from "./utils";

type UseSiteStatus = [boolean, () => void];
export const useSiteStatus = (url: string): UseSiteStatus => {
    const [active, setActive] = useState(false);

    useEffect((): void => {
        if (!url) {
            return;
        }
        pingSite({ url, cb: setActive, ignoreCache: false });
    }, [url]);

    return [
        active,
        () => {
            pingSite({ url, cb: setActive, ignoreCache: true });
        }
    ];
};
