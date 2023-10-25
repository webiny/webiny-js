import { useCallback, useEffect, useRef, useState } from "react";

interface UseFetchDataProps {
    callback: () => Promise<any>;
    interval: number;
    loading: boolean;
}

interface UseFetchDataResult {
    error: Record<string, any> | null;
}

export const useFetchInterval = ({
    callback,
    interval,
    loading
}: UseFetchDataProps): UseFetchDataResult => {
    const [error, setError] = useState<Record<string, any> | null>(null);
    const timer = useRef<string | number | NodeJS.Timeout | undefined>(undefined);

    const [initiallyLoaded, setInitiallyLoaded] = useState<boolean>(false);

    // Recursive function which will not execute until api call is finished + the delay
    const getData = useCallback(async () => {
        try {
            await callback();
            clearTimeout(timer.current);
            timer.current = setTimeout(() => {
                getData();
            }, interval);
        } catch (e) {
            setError(e);
        }
    }, []);

    useEffect(() => {
        /**
         * We do not want to do anything if initial load was already done.
         */
        if (initiallyLoaded === true) {
            return;
        }
        /**
         *  When initiallyLoaded is false and loading is false, it means the initial loading was done so we can mark it.
         */
        //
        else if (initiallyLoaded === false && loading === false) {
            setInitiallyLoaded(true);
        }
        /**
         * When initiallyLoaded is false and loading is true, it means that this is the initial load.
         */
        //
        else if (initiallyLoaded === false && loading === true) {
            setInitiallyLoaded(false);
        }
    }, [loading]);

    useEffect(() => {
        if (initiallyLoaded !== true) {
            return;
        }
        getData().catch(e => {
            setError(e);
            // do nothing
            console.warn("Could not fetch the data:");
            console.log(e);
        });
        return () => {
            clearTimeout(timer.current);
        };
    }, [initiallyLoaded]);

    return {
        error
    };
};
