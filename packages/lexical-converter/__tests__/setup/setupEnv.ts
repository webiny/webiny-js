// noinspection JSConstantReassignment
// @ts-expect-error
const { TextEncoder, TextDecoder } = require("util");

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;
