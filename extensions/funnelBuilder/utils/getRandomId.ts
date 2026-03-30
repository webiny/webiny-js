export const getRandomId = () => {
    return Math.random().toString(36).substr(2, 7);
};
