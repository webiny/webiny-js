export const sleep = (ms = 1000) =>
    new Promise(resolve => {
        setTimeout(resolve, ms);
    });
