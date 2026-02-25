const domain = "http://localhost:3000";

export const getPreviewUrl = (editorOrigin: string) => {
    return `${domain}/cms/live-preview?origin=${editorOrigin}`;
};
