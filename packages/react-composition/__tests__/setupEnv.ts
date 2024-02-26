// noinspection JSConstantReassignment

// This is why this file is necessary: https://github.com/ai/nanoid/issues/363

const { randomFillSync } = require("crypto");
// @ts-expect-error
const { TextEncoder, TextDecoder } = require("util");

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;
// @ts-expect-error
window.crypto = {
    getRandomValues(buffer) {
        return randomFillSync(buffer);
    }
};
