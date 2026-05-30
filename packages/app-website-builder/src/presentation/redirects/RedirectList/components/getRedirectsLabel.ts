export const getRedirectsLabel = (count = 0): string => {
    return `${count} ${count === 1 ? "redirect" : "redirects"}`;
};
