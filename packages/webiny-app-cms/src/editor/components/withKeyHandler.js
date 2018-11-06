/**
 * This HOC currently only works with single instance of a component.
 * That is caused by ID generation for an entire component, not for an instance of the component.
 * If you need to change that - take a look at the `decorator` function at the bottom of the file and
 * try to adapt the logic to work with multiple instances.
 */

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

const addKeyHandler = (id, key, handler) => {
    setupListener();
    keyStack[key] = keyStack[key] || [];
    if (!keyStack[key].find(item => item.id === id)) {
        keyStack[key].unshift({ id, handler });
    }
};

const removeKeyHandler = (id, key) => {
    if(!keyStack[key]) {
        return;
    }

    const index = keyStack[key].findIndex(item => item.id === id);
    if (index >= 0) {
        keyStack[key].splice(index, 1);
    }
};

export function withKeyHandler() {
    return function decorator(Component) {
        // Generate a unique ID for this component
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
