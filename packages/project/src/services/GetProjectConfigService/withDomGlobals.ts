import { JSDOM } from "jsdom";

interface DomGlobals {
    window: unknown;
    document: unknown;
}

/*
 * `react-dom` needs `window` and `document` to exist as globals, so the config render borrows a JSDOM
 * instance for as long as it takes. The child process this used to run in could simply leave them
 * lying around; here they have to be put back, because the CLI carries on afterwards and plenty of
 * libraries decide whether they are in a browser by looking at exactly these two.
 *
 * Callers must have finished importing the config before calling this, so that module-level
 * `typeof window` checks in the config's own import graph still see Node. That is the order the child
 * process used, and changing it would quietly change what those modules decide about themselves.
 */
export const withDomGlobals = async <T>(fn: (container: Element) => Promise<T>): Promise<T> => {
    const { window } = new JSDOM(`<div id="root"/>`);

    const globals: DomGlobals = globalThis as unknown as DomGlobals;
    const hadWindow = "window" in globalThis;
    const hadDocument = "document" in globalThis;
    const previousWindow = globals.window;
    const previousDocument = globals.document;

    globals.window = window;
    globals.document = window.document;

    const container = window.document.getElementById("root")!;

    try {
        return await fn(container);
    } finally {
        if (hadWindow) {
            globals.window = previousWindow;
        } else {
            delete (globalThis as Record<string, unknown>)["window"];
        }

        if (hadDocument) {
            globals.document = previousDocument;
        } else {
            delete (globalThis as Record<string, unknown>)["document"];
        }

        window.close();
    }
};
