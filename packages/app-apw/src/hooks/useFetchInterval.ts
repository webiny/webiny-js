import { useCallback, useEffect, useState } from "react";

interface UseFetchDataProps {
    fetchCallback: () => Promise<Record<string, any>> | null;
    fetchInterval: number;
}

interface UseFetchDataResult {
    data: Record<string, any> | null;
    error: Record<string, any> | null;
}

export const useFetchInterval = ({
    fetchCallback,
    fetchInterval
}: UseFetchDataProps): UseFetchDataResult => {
    const [data, setData] = useState<Record<string, any> | null>(null);
    const [error, setError] = useState<Record<string, any> | null>(null);
    let timer: string | number | NodeJS.Timeout | undefined;

    // Recursive function which will not execute until api call is finished + the delay
    const getData = useCallback(async () => {
        try {
            const data = fetchCallback();
            setData(data);
            clearTimeout(timer);
            timer = setTimeout(() => {
                getData();
            }, fetchInterval);
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
        data,
        error
    };
};
