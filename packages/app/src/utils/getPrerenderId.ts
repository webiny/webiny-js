declare global {
    interface Window {
        __PS_RENDER_ID__: string;
    }
}

export const getPrerenderId = (): string | null => {
    return window["__PS_RENDER_ID__"] || null;
};
