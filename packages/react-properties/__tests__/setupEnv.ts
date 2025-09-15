// noinspection JSConstantReassignment

// This is why this file is necessary: https://github.com/ai/nanoid/issues/363
import { randomFillSync } from "crypto";
import { TextEncoder, TextDecoder } from "util";

// @ts-expect-error
global.TextEncoder = TextEncoder;
// @ts-expect-error
global.TextDecoder = TextDecoder;

window.crypto = {
    // @ts-expect-error
    getRandomValues(buffer) {
        // @ts-expect-error
        return randomFillSync(buffer);
    }
};
