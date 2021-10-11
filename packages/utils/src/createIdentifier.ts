import { zeroPad } from "~/zeroPad";
import { parseIdentifier } from "~/parseIdentifier";

/**
 * Used to create the identifier that is an absolute unique for the record.
 * It is created out of the generated ID and version of the record.
 *
 *
 * The input ID is being parsed as you might send a full ID instead of only the generated one.
 */
export interface CreateIdentifierParams {
    id: string;
    version: number;
}

export const createIdentifier = (values: CreateIdentifierParams): string => {
    const { id } = parseIdentifier(values.id);

    return `${id}#${zeroPad(values.version)}`;
};
