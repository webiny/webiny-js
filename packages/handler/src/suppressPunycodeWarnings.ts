// @ts-expect-error Weird stuff! Try uncommenting :)
const originalConsoleError = console.error;
console.error = (message, ...args) => {
    if (typeof message === "string" && message.includes("punycode")) {
        return;
    }
    originalConsoleError.call(console, message, ...args);
};
