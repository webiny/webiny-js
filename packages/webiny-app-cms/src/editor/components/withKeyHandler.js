import React from "react";
import shortid from "shortid";
import isHotkey from "is-hotkey";
const keyStack = {};

let listener = false;
const filter = ["TEXTAREA", "INPUT"];

const setupListener = () => {
    if (!listener) {
        document.body &&
            document.body.addEventListener("keydown", e => {
                // We ignore all keyboard events coming from within `slateEditor` element and inputs.
                if (e.srcElement.dataset.slateEditor || filter.includes(e.srcElement.nodeName)) {
                    return;
                }

                let matchedKey = Object.keys(keyStack).find(key => isHotkey(key, e));

                if (matchedKey && keyStack[matchedKey].length > 0) {
                    const item = keyStack[matchedKey][0];
                    item.handler(e);
                }
            });
        listener = true;
    }
};

const addKeyHandler = (id, key, handler) => {
    setupListener();
    keyStack[key] = keyStack[key] || [];
    if (!keyStack[key].find(item => item.id === id)) {
        keyStack[key].unshift({ id, handler });
    }
};

const removeKeyHandler = (id, key) => {
    const index = keyStack[key].findIndex(item => item.id === id);
    if (index >= 0) {
        keyStack[key].splice(index, 1);
    }
};

export function withKeyHandler() {
    return function decorator(Component) {
        const id = shortid.generate();

        const keyProps = {
            addKeyHandler(key, handler) {
                addKeyHandler(id, key, handler);
            },
            removeKeyHandler(key) {
                removeKeyHandler(id, key);
            }
        };

        return props => {
            return <Component {...props} {...keyProps} />;
        };
    };
}
