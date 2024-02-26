import { nanoid, customAlphabet } from "nanoid";
/**
 * Package nanoid-dictionary is missing types
 */
// @ts-expect-error
import { lowercase, uppercase, alphanumeric, numbers } from "nanoid-dictionary";

const DEFAULT_SIZE = 21;

export const generateAlphaNumericId = customAlphabet(alphanumeric, DEFAULT_SIZE);

export const generateAlphaNumericLowerCaseId = customAlphabet(
    `${lowercase}${numbers}`,
    DEFAULT_SIZE
);

export const generateAlphaId = customAlphabet(`${lowercase}${uppercase}`, DEFAULT_SIZE);

export const generateAlphaLowerCaseId = customAlphabet(lowercase, DEFAULT_SIZE);

export const generateAlphaUpperCaseId = customAlphabet(uppercase, DEFAULT_SIZE);

export const generateId = (size = DEFAULT_SIZE): string => {
    return nanoid(size);
};
