import { NetworkStatus } from "apollo-client";
import { useCallback, useEffect, useRef } from "react";

interface UseApolloClientRefetchInterval {
    networkStatus: NetworkStatus;
    loading: boolean;
    interval: number;
    callback: Function;
}

export const useApolloClientRefetchInterval = ({
    networkStatus,
    loading,
    interval,
    callback
}: UseApolloClientRefetchInterval) => {
    const timeoutRef = useRef<string | number | NodeJS.Timeout | undefined>(undefined);
    const prevNetworkStatusRef = useRef<NetworkStatus | undefined>(undefined);

    const getData = useCallback(async () => {
        try {
            console.timeLog("general-time", "call-refatch");
            await callback();
        } catch (e) {
            console.log("Error re-fetch", e);
        }
    }, []);

    useEffect(() => {
        // Apollo client executed the request and waiting for response
        if (
            prevNetworkStatusRef.current !== networkStatus &&
            networkStatus === NetworkStatus.refetch &&
            loading
        ) {
            console.timeLog("general-time", "request started");
            console.time("request");
            prevNetworkStatusRef.current = NetworkStatus.refetch;
            clearTimeout(timeoutRef.current);
        }

        // Apollo client have the response for our request
        if (
            prevNetworkStatusRef.current === NetworkStatus.refetch &&
            networkStatus !== NetworkStatus.refetch &&
            !loading
        ) {
            prevNetworkStatusRef.current = undefined;
            // call the  function after x seconds
            console.timeLog("general-time", "request end");
            console.timeEnd("request");
            timeoutRef.current = setTimeout(getData, interval);
        }
    }, [networkStatus, loading]);

    useEffect(() => {
        console.time("general-time");
        getData().catch(e => {
            console.log("fetch error", e);
        });
    }, []);
};
