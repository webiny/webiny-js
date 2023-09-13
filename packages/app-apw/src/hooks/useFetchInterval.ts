import { useCallback, useEffect, useState } from "react";

interface UseFetchDataProps {
    callback: () => Promise<any>;
    interval: number;
    vars?: Record<string, any>;
}

interface UseFetchDataResult {
    error: Record<string, any> | null;
}

export const useFetchInterval = ({ callback, interval }: UseFetchDataProps): UseFetchDataResult => {
    const [error, setError] = useState<Record<string, any> | null>(null);
    let timer: string | number | NodeJS.Timeout | undefined;

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
        getData().catch(e => {
            setError(e);
            // do nothing
            console.warn("Could not fetch the data:");
            console.log(e);
        });
        return () => clearTimeout(timer);
    }, []);

    return {
        error
    };
};
