export const isPrerendering = (): boolean => {
    return "__PS_RENDER__" in window;
};
