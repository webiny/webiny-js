// @flow
import React from "react";
import shortid from "shortid";
import isHotkey from "is-hotkey";
const keyStack = {};

let listener = false;
const filter = ["TEXTAREA", "INPUT"];

const setupListener = () => {
    if (!listener && document.body) {
        document.body.addEventListener("keydown", e => {
            // We ignore all keyboard events coming from within `slateEditor` element and inputs.
            if (e.srcElement.dataset.slateEditor || filter.includes(e.srcElement.nodeName)) {
                return;
            }

            let matchedKey = Object.keys(keyStack).find(key => isHotkey(key, e));

            if (matchedKey && keyStack[matchedKey].length > 0) {
                const item = keyStack[matchedKey][0];
                item.handler(e);
                e.stopPropagation();
            }
        });

        listener = true;
    }
};

const addKeyHandler = (
    id: string,
    key: string,
    handler: (e: SyntheticKeyboardEvent<HTMLElement>) => void
) => {
    setupListener();
    keyStack[key] = keyStack[key] || [];
    if (!keyStack[key].find(item => item.id === id)) {
        keyStack[key].unshift({ id, handler });
    }
};

const removeKeyHandler = (id, key) => {
    if (!keyStack[key]) {
        return;
    }

    const index = keyStack[key].findIndex(item => item.id === id);
    if (index >= 0) {
        keyStack[key].splice(index, 1);
    }
};

type AddKeyHandlerType = (
    key: String,
    handler: (e: SyntheticKeyboardEvent<HTMLElement>) => void
) => void;

type RemoveKeyHandlerType = (key: String) => void;

export function useKeyHandler(): {
    addKeyHandler: AddKeyHandlerType,
    removeKeyHandler: RemoveKeyHandlerType
} {
    const [id] = React.useState(shortid.generate());

    return React.useMemo(
        () => ({
            addKeyHandler(key, handler) {
                addKeyHandler(id, key, handler);
            },
            removeKeyHandler(key) {
                removeKeyHandler(id, key);
            }
        }),
        []
    );
}
