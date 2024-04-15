import { useEffect } from "react";

export const usePingUrl = (url: string, cb: (isValid: boolean) => void) => {
    useEffect(() => {
        fetch(url, { method: "HEAD", mode: "no-cors" })
            .then(() => {
                cb(true);
            })
            .catch(() => {
                cb(false);
            });
    }, [url]);
};
