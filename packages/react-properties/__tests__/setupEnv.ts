// @ts-nocheck
// noinspection JSConstantReassignment

// This is why this file is necessary: https://github.com/ai/nanoid/issues/363

const { randomFillSync } = require("crypto");
const { TextEncoder, TextDecoder } = require("util");

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;
window.crypto = {
    getRandomValues(buffer) {
        return randomFillSync(buffer);
    }
};
