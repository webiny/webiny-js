import { customAlphabet } from "nanoid";

const ALPHANUMERIC = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
export const getNanoid = customAlphabet(ALPHANUMERIC, 10);
