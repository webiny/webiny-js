// @flow
import React, { useEffect } from "react";
import isHotkey from "is-hotkey";

const state = {
    listenerAttached: false,
    zIndex: null,
    handlers: {}
};

// 1. samo ej jedan listener registriran
// 2. no listener when no shortcuts active
// 3. automatically warns about keys clashing
// 4. samo listeneri na trenutnom zIndexu se executaju
window.kst = state;

function triggerShortcuts(e) {
    const keys = state.handlers[state.zIndex];
    for (let key in keys) {
        if (isHotkey(key, e)) {
            keys[key]();
            break;
        }
    }
}

function registerKeys({ zIndex, keys }) {
    if (state.zIndex === null || state.zIndex < zIndex) {
        state.zIndex = zIndex;
    }

    if (!state.handlers[zIndex]) {
        state.handlers[zIndex] = {};
    }

    if (!keys || Object.keys(keys).length === 0) {
        return;
    }

    if (!state.listenerAttached) {
        document.body.addEventListener("keydown", triggerShortcuts);
        state.listenerAttached = true;
    }

    for (let key in keys) {
        if (key in state.handlers[zIndex]) {
            throw Error(`Shortcut "${key}" already registered on zIndex ${zIndex}.`);
        }
        state.handlers[zIndex][key] = keys[key];
    }
}

function unregisterKeys({ zIndex, keys }) {
    for (let key in keys) {
        delete state.handlers[zIndex][key];
    }

    if (state.handlers[zIndex] && Object.keys(state.handlers[zIndex]).length === 0) {
        delete state.handlers[zIndex];
    }

    if (Object.keys(state.handlers).length) {
        state.zIndex = Math.max(...Object.keys(state.handlers));
    } else {
        state.zIndex = null;
    }

    if (state.listenerAttached && Object.keys(state.handlers).length === 0) {
        document.body.removeEventListener("keydown", triggerShortcuts);
        state.listenerAttached = false;
    }
}

export function useKeys(props) {
    const { disabled } = props;
    useEffect(() => {
        disabled ? unregisterKeys(props) : registerKeys(props);
        return () => {
            unregisterKeys(props);
        };
    }, [disabled]);
}

export function Keys({ children, ...props }) {
    useKeys(props);
    return <>{children}</>;
}
