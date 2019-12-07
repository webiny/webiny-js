export default (...args) => {
    if (process.env.NODE_ENV === "development") {
        console.log(...args);
    }
};
