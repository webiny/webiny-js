import { useEffect, useState } from "react";
import { pingSite } from "@webiny/app-page-builder/admin/hooks/usePageBuilderSettings/usePageBuilderSettingsUtils";

export const useSiteStatus = url => {
    const [active, setActive] = useState(true);

    useEffect(() => {
        if (url) {
            pingSite({ url, cb: setActive, byPassCache: false }).then();
        }
    }, [url]);

    return [
        active,
        () => {
            pingSite({ url, cb: setActive, byPassCache: true }).then();
        }
    ];
};
