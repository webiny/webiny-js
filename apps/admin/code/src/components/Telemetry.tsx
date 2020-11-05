import { useEffect } from "react";
import { useRouter } from "@webiny/react-router";
import { sendEvent } from "@webiny/tracking/react";

export const Telemetry = () => {
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

    return null;
};
