import { useEffect, useRef, useState } from "react";

type CallBackType<T> = (updatedValue: T) => void;

type SetStateType<T> = T | ((prev: T) => T);

type RetType = <T>(
    initialValue: T | (() => T)
) => [T, (newValue: SetStateType<T>, callback?: CallBackType<T>) => void];

export const useStateWithCallback: RetType = <T>(initialValue: T | (() => T)) => {
    const [state, _setState] = useState<T>(initialValue);
    const callbackQueue = useRef<CallBackType<T>[]>([]);

    useEffect(() => {
        callbackQueue.current.forEach((cb) => cb(state));
        callbackQueue.current = [];
    }, [state]);

    const setState = (value: SetStateType<T>, callback?: CallBackType<T>) => {
        _setState(value);
        if (callback && typeof callback === "function") {
            callbackQueue.current.push(callback);
        }
    };
    return [state, setState];
};