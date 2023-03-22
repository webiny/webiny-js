export const delay = (milliseconds: number) => {
    return new Promise(resolve => {
        setTimeout(resolve, milliseconds);
    });
};
