import React, { useEffect, useRef, useState } from "react";
import { useAsyncProperties } from "./AsyncProperties.js";

interface AwaitProps<T> {
    fn: () => Promise<T>;
    children: (value: T) => React.ReactNode;
}

export function Await<T>({ fn, children }: AwaitProps<T>) {
    const async = useAsyncProperties();
    const [result, setResult] = useState<{ data: T } | { error: unknown } | null>(null);
    const registeredRef = useRef(false);
    const settledRef = useRef(false);

    if (!registeredRef.current && async) {
        registeredRef.current = true;
        async.incrementPending();
    }

    useEffect(() => {
        let cancelled = false;

        fn().then(
            data => {
                if (!cancelled) {
                    settledRef.current = true;
                    setResult({ data });
                }
            },
            error => {
                if (!cancelled) {
                    settledRef.current = true;
                    setResult({ error });
                }
            }
        );

        return () => {
            cancelled = true;
            if (!settledRef.current && async) {
                async.decrementPending();
            }
        };
    }, []);

    useEffect(() => {
        if (result !== null && async) {
            async.decrementPending();
        }
    }, [result]);

    if (result && "data" in result) {
        return <>{children(result.data)}</>;
    }

    return null;
}
