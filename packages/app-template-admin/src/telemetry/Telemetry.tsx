/* eslint-disable */
import React, { useEffect } from "react";
import { useRouter } from "@webiny/react-router";
import { sendEvent } from "@webiny/tracking/react";

export const Telemetry = ({ children }) => {
    if (process.env.REACT_APP_WEBINY_TELEMETRY !== "false") {
        const router = useRouter();

        useEffect(() => {
            sendEvent("pageview", {
                url: router.location.pathname,
                domain: window.location.origin
            });

            return router.history.listen(location => {
                sendEvent("pageview", {
                    url: location.pathname,
                    domain: window.location.origin
                });
            });
        }, []);
    }

    return children;
};
