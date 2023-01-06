export const isPrerendering = () => {
    return "__PS_RENDER__" in window;
};
