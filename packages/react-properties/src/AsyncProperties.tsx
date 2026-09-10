import React, { createContext, useCallback, useContext, useRef } from "react";
import { Properties, useProperties } from "./Properties.js";
import type { Property } from "./Properties.js";
import type { PropertyStore } from "./domain/index.js";

interface AsyncPropertiesContextValue {
    incrementPending(): void;
    decrementPending(): void;
}

const AsyncPropertiesContext = createContext<AsyncPropertiesContextValue | undefined>(undefined);

export function useAsyncProperties() {
    return useContext(AsyncPropertiesContext);
}

interface AsyncPropertiesProps {
    name?: string;
    onChange?(properties: Property[]): void;
    children: React.ReactNode;
}

const StoreCapture = ({
    storeRef,
    children
}: {
    storeRef: React.MutableRefObject<PropertyStore | null>;
    children: React.ReactNode;
}) => {
    const { store } = useProperties();
    storeRef.current = store;
    return <>{children}</>;
};

export const AsyncProperties = ({ name, onChange, children }: AsyncPropertiesProps) => {
    const pendingRef = useRef(0);
    const onChangeRef = useRef(onChange);
    onChangeRef.current = onChange;
    const storeRef = useRef<PropertyStore | null>(null);

    const interceptedOnChange = useCallback((properties: Property[]) => {
        if (pendingRef.current > 0) {
            return;
        }
        onChangeRef.current?.(properties);
    }, []);

    const contextValue = useRef<AsyncPropertiesContextValue>({
        incrementPending() {
            pendingRef.current++;
        },
        decrementPending() {
            pendingRef.current = Math.max(0, pendingRef.current - 1);
            if (pendingRef.current === 0) {
                setTimeout(() => {
                    if (pendingRef.current === 0 && storeRef.current) {
                        storeRef.current.notify();
                    }
                }, 0);
            }
        }
    }).current;

    return (
        <AsyncPropertiesContext.Provider value={contextValue}>
            <Properties name={name} onChange={interceptedOnChange}>
                <StoreCapture storeRef={storeRef}>{children}</StoreCapture>
            </Properties>
        </AsyncPropertiesContext.Provider>
    );
};
