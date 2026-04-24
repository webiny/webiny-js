import { isHotkey } from "is-hotkey";

interface KeyHandler {
    id: string;
    handler: (e: KeyboardEvent) => void;
}

const keyStack: Record<string, KeyHandler[]> = {};
let listenerInitialized = false;
const filterTags = ["TEXTAREA", "INPUT"];

const isContentEditable = (value: any) => {
    return ["true", true].includes(value);
};

let idCounter = 0;
const generateSimpleId = () => `hotkey-${++idCounter}`;

const setupListener = (): void => {
    if (listenerInitialized || !document.body) {
        return;
    }

    const eventListener = (ev: KeyboardEvent) => {
        const target = ev.target as HTMLElement;

        if (!target) {
            return;
        }
        if (filterTags.includes(target.nodeName) || isContentEditable(target.contentEditable)) {
            return;
        }

        const matchedKey = Object.keys(keyStack).find(key => isHotkey(key, ev));
        if (matchedKey && keyStack[matchedKey]?.length > 0) {
            const item = keyStack[matchedKey][0];
            item.handler(ev);
            ev.stopPropagation();
        }
    };

    document.body.addEventListener("keydown", eventListener);
    listenerInitialized = true;
};

export class HotkeyManager {
    private readonly id: string;

    constructor() {
        this.id = generateSimpleId();
        setupListener();
    }

    add(key: string, handler: (e: KeyboardEvent) => void): void {
        keyStack[key] = keyStack[key] || [];
        const exists = keyStack[key].some(item => item.id === this.id);
        if (!exists) {
            keyStack[key].unshift({ id: this.id, handler });
        }
    }

    remove(key: string): void {
        if (!keyStack[key]) {
            return;
        }

        const index = keyStack[key].findIndex(item => item.id === this.id);
        if (index >= 0) {
            keyStack[key].splice(index, 1);
        }
    }
}
