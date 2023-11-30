// @ts-expect-error `mdbid` package has no types
import generateId from "mdbid";

export const mdbid = (): string => generateId();
