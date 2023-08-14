export const isUrlLinkReference = (url: string) => {
    const match = url.match(/^#/);
    return match != null;
};
