export default ms => {
    return new Promise(resolve => {
        setTimeout(() => {
            // @ts-ignore
            resolve();
        }, ms);
    });
};
