const INCLUDES = ["localhost", "127.0.0.1"];

export const isLocalhost = () => {
    const href = window.location.href;
    return INCLUDES.some(current => href.includes(current));
};
