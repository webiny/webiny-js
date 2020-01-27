import * as React from "react";
import { PbAddonRenderPlugin } from "@webiny/app-page-builder/types";

const InvalidateExpiredSsrCache = () => {
    React.useEffect(() => {
        if (!window) {
            return;
        }

        if (window.location.hostname === "localhost") {
            return;
        }

        setTimeout(() => {
            window.fetch(window.location.origin, {
                method: "post",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    ssr: [
                        "invalidateSsrCacheByPath",
                        {
                            path: window.location.pathname + window.location.search,
                            expired: true,
                            refresh: true
                        }
                    ]
                })
            });
        }, 1000);
    }, []);

    return null;
};

export default [
    {
        type: "addon-render",
        name: "addon-render-ssr-cache-invalidation",
        component: <InvalidateExpiredSsrCache />
    } as PbAddonRenderPlugin
];
