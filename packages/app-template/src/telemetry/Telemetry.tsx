/* eslint-disable */
import React, { useEffect, useCallback } from "react";
import { useRouter } from "@webiny/react-router";

export const Telemetry = ({ children }) => {
    if (process.env.REACT_APP_WEBINY_TELEMETRY !== "false") {
        const API_KEY = "ZdDZgkeOt4Z_m-UWmqFsE1d6-kcCK3BH0ypYTUIFty4";
        const API_URL = "https://t.webiny.com";

        const sendEvent = useCallback(payload => {
            const formData = new FormData();
            formData.append("data", btoa(JSON.stringify(payload)));

            return fetch(API_URL + "/capture/", {
                method: "POST",
                body: formData
            }).catch(() => {
                // Ignore errors
            });
        }, []);

        const sendPageView = useCallback(({ distinct_id, ...data }: any) => {
            return sendEvent({
                api_key: API_KEY,
                distinct_id,
                event: "pageview",
                properties: data,
                timestamp: new Date().toISOString()
            });
        }, []);

        const router = useRouter();

        useEffect(() => {
            sendPageView({
                distinct_id: process.env.REACT_APP_USER_ID,
                url: router.location.pathname,
                domain: window.location.origin
            });

            return router.history.listen(location => {
                sendPageView({
                    distinct_id: process.env.REACT_APP_USER_ID,
                    url: location.pathname,
                    domain: window.location.origin
                });
            });
        }, []);
    }

    return children;
};
