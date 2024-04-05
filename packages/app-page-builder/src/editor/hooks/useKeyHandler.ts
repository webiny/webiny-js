import React, { SyntheticEvent } from "react";
import isHotkey from "is-hotkey";
import { getNanoid } from "../helpers";

interface KeyHandler {
    id: string;
    handler: any;
}
const keyStack: Record<string, KeyHandler[]> = {};

let listener = false;
const filter = ["TEXTAREA", "INPUT"];

const isContentEditable = (value: any) => {
    return ["true", true].includes(value);
};

const setupListener = (): void => {
    if (listener || !document.body) {
        return;
    }
    document.body.addEventListener("keydown", ev => {
        if (!ev.target) {
            return;
        }
        const target = ev.target as HTMLElement;
        // We ignore all keyboard events coming from within contentEditable element and inputs.
        if (filter.includes(target.nodeName) || isContentEditable(target.contentEditable)) {
            return;
        }

        const matchedKey = Object.keys(keyStack).find(key => isHotkey(key, ev));

        if (matchedKey && keyStack[matchedKey].length > 0) {
            const item = keyStack[matchedKey][0];
            item.handler(ev);
            ev.stopPropagation();
        }
    });

    listener = true;
};

const addKeyHandler = (
    id: string,
    key: string,
    handler: (e: SyntheticEvent<HTMLElement>) => void
) => {
    setupListener();
    keyStack[key] = keyStack[key] || [];
    if (!keyStack[key].find(item => item.id === id)) {
        keyStack[key].unshift({ id, handler });
    }
};

const removeKeyHandler = (id: string, key: string): void => {
    if (!keyStack[key]) {
        return;
    }

    const index = keyStack[key].findIndex(item => item.id === id);
    if (index >= 0) {
        keyStack[key].splice(index, 1);
    }
};

type AddKeyHandlerType = (key: string, handler: (e: SyntheticEvent<HTMLElement>) => void) => void;

type RemoveKeyHandlerType = (key: string) => void;

export function useKeyHandler(): {
    addKeyHandler: AddKeyHandlerType;
    removeKeyHandler: RemoveKeyHandlerType;
} {
    const idRef = React.useRef(getNanoid());

    return React.useMemo(
        () => ({
            addKeyHandler(key, handler) {
                addKeyHandler(idRef.current, key, handler);
            },
            removeKeyHandler(key) {
                removeKeyHandler(idRef.current, key);
            }
        }),
        []
    );
}
