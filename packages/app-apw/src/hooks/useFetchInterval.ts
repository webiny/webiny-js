import { useCallback, useEffect, useState } from "react";

interface UseFetchDataProps {
    callback: Function;
    interval: number;
    vars?: Record<string, any>;
}

interface UseFetchDataResult {
    error: Record<string, any> | null;
}

export const useFetchInterval = ({
    callback,
    interval,
    vars
}: UseFetchDataProps): UseFetchDataResult => {
    const [error, setError] = useState<Record<string, any> | null>(null);
    let timer: string | number | NodeJS.Timeout | undefined;

    // Recursive function which will not execute until api call is finished + the delay
    const getData = useCallback(
        async (vars?: Record<string, any>) => {
            try {
                await callback(vars);
                clearTimeout(timer);
                timer = setTimeout(() => {
                    getData(vars);
                }, interval);
            } catch (e) {
                setError(e);
            }
        },
        [vars]
    );

    useEffect(() => {
        getData(vars).catch(e => {
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
