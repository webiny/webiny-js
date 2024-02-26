let pbDocumentCheck: Promise<void>;

export const initializeAos = async () => {
    // Instead of doing these imports at the top of the file, let's import
    // these dependencies only when the attributes modifier is actually used.
    // Additionally, we only want to do this in the browser, hence the window check.
    if (typeof window === "undefined") {
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

    /**
     * Please, no questions.
     */
    // eslint-disable-next-line
    await import(
        /* webpackChunkName: "pageBuilderElementsModifiersAttributesAnimationInitializeAosCss" */
        // @ts-expect-error
        "aos/dist/aos.css"
    );
    const aos = await import(
        /* webpackChunkName: "pageBuilderElementsModifiersAttributesAnimationInitializeAosJs" */
        "aos"
    );

    aos.init();
};
