export default () => {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve();
        }, 5);
    });
};
