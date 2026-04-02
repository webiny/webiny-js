import { useEffect, useRef } from "react";
import isHotkey from "is-hotkey";

type HookProps = {
    disabled?: boolean;
    zIndex: number;
    keys?: { [key: string]: (e: KeyboardEvent) => void };
};

type State = {
    listenerAttached: boolean;
    zIndex: null | number;
    handlers: { [zIndex: number]: { [key: string]: (e: KeyboardEvent) => void } };
};

const state: State = {
    listenerAttached: false,
    zIndex: null,
    handlers: {}
};

function triggerHotkeys(e: KeyboardEvent) {
    if (state.zIndex === null) {
        return;
    }

    const keys = state.handlers[state.zIndex];
    for (const key in keys) {
        if (isHotkey(key, e)) {
            keys[key](e);
            break;
        }
    }
}

function registerZIndex({ zIndex, keys }: HookProps) {
    if (state.zIndex === null || state.zIndex < zIndex) {
        state.zIndex = zIndex;
    }

    if (!state.handlers[zIndex]) {
        state.handlers[zIndex] = {};
    }

    if (!keys || Object.keys(keys).length === 0) {
        return;
    }

    for (const key in keys) {
        if (key in state.handlers[zIndex]) {
            throw Error(`Shortcut "${key}" already registered on zIndex ${zIndex}.`);
        }
        state.handlers[zIndex][key] = keys[key];
    }

    if (!state.listenerAttached) {
        document.body.addEventListener("keydown", triggerHotkeys);
        state.listenerAttached = true;
    }
}

function unregisterZIndex({ zIndex, keys }: HookProps) {
    if (state.handlers && state.handlers[zIndex]) {
        for (const key in keys) {
            delete state.handlers[zIndex][key];
        }

        if (Object.keys(state.handlers[zIndex]).length === 0) {
            delete state.handlers[zIndex];
        }
    }

    if (Object.keys(state.handlers).length > 0) {
        state.zIndex = Math.max(...Object.keys(state.handlers).map(Number));
    } else {
        state.zIndex = null;

        if (state.listenerAttached) {
            document.body.removeEventListener("keydown", triggerHotkeys);
            state.listenerAttached = false;
        }
    }
}

export function useHotkeys(props: HookProps) {
    const { disabled, zIndex, keys } = props;

    const prevPropsRef = useRef<HookProps | undefined>();
    const firstRenderRef = useRef(true);

    useEffect(
        function () {
            if (firstRenderRef.current || prevPropsRef.current?.disabled !== disabled) {
                firstRenderRef.current = false;
                if (disabled) {
                    unregisterZIndex(props);
                } else {
                    registerZIndex(props);
                }
            }

            if (!disabled && typeof keys === "object") {
                Object.assign(state.handlers[zIndex], keys);
            }
            prevPropsRef.current = { ...props };
        },
        [keys]
    );

    useEffect(function () {
        return function () {
            if (!disabled) {
                unregisterZIndex(props);
            }
        };
    }, []);
}
