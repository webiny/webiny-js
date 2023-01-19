declare global {
    interface Window {
        aosInitialized: boolean;
    }
}

let pbDocumentCheck: Promise<void>;

export const initializeAos = async () => {
    // Instead of doing these imports at the top of the file, let's import
    // these dependencies only when the attributes modifier is actually used.
    // Additionally, we only want to do this in the browser, hence the window check.
    if (typeof window === "undefined") {
        return;
    }

    // By assigning this flag into the `window` object, we get to ensure
    // that AOS is not initialized multiple times by multiple `createAnimation`
    // calls. This is something that's possible in the Admin application.
    if (window.aosInitialized) {
        return;
    }

    if (!pbDocumentCheck) {
        pbDocumentCheck = new Promise<void>(resolve => {
            const interval = setInterval(() => {
                if (document.querySelector("pb-document")) {
                    clearInterval(interval);
                    resolve();
                }
            }, 333);
        });
    }

    await pbDocumentCheck;

    // @ts-ignore Complains about the `.css` format, but all works correctly.
    await import("aos/dist/aos.css");
    const aos = await import("aos");

    window.aosInitialized = true;
    aos.init();
};
