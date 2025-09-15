// noinspection JSConstantReassignment
import { TextDecoder, TextEncoder } from "util";

// @ts-expect-error
global.TextEncoder = TextEncoder;
// @ts-expect-error
global.TextDecoder = TextDecoder;
