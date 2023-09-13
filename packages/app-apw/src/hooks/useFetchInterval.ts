import { useCallback, useEffect, useRef, useState } from "react";

interface UseFetchDataProps {
    callback: () => Promise<any>;
    interval: number;
}

interface UseFetchDataResult {
    error: Record<string, any> | null;
}

export const useFetchInterval = (
    { callback, interval }: UseFetchDataProps,
    startFetching?: boolean
): UseFetchDataResult => {
    const [error, setError] = useState<Record<string, any> | null>(null);
    let timer: string | number | NodeJS.Timeout | undefined;
    const isInitializedRef = useRef(false);

    // Recursive function which will not execute until api call is finished + the delay
    const getData = useCallback(async () => {
        try {
            await callback();
            clearTimeout(timer);
            timer = setTimeout(() => {
                getData();
            }, interval);
        } catch (e) {
            setError(e);
        }
    }, []);

    useEffect(() => {
        // prevent hook to be initialized multiple times
        if (!isInitializedRef.current && startFetching) {
            isInitializedRef.current = true;

            getData().catch(e => {
                setError(e);
                // do nothing
                console.warn("Could not fetch the data:");
                console.log(e);
            });
        }
        return () => {
            clearTimeout(timer);
            isInitializedRef.current = false;
        };
    }, [startFetching]);

    return {
        error
    };
};
