import { useEffect, useState } from "react";
import { pingSite } from "./utils";

export const useSiteStatus = url => {
    const [active, setActive] = useState(true);

    useEffect(() => {
        if (url) {
            pingSite({ url, cb: setActive, ignoreCache: false });
        }
    }, [url]);

    return [
        active,
        () => {
            pingSite({ url, cb: setActive, ignoreCache: true });
        }
    ];
};
