const INCLUDES = ["localhost", "127.0.0.1"];

export const isLocalhost = (): boolean => INCLUDES.includes(window.location.href);
