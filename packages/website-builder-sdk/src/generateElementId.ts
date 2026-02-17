import { customAlphabet } from "nanoid";
import { lowercase, numbers } from "nanoid-dictionary";

const DEFAULT_SIZE = 21;

export const generateElementId = customAlphabet(`${lowercase}${numbers}`, DEFAULT_SIZE);
