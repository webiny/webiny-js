// Suppress the `punycode` deprecation warning emitted by transitive deps.
// This is a known upstream issue we can't fix, so we filter it out.
const originalConsoleError = console.error;
console.error = (message: unknown, ...args: unknown[]) => {
    if (typeof message === "string" && message.includes("punycode")) {
        return;
    }
    originalConsoleError.call(console, message, ...args);
};
