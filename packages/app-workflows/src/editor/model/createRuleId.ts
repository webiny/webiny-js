const ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";
const SUFFIX_LENGTH = 12;

function createSuffix(): string {
    let suffix = "";
    for (let index = 0; index < SUFFIX_LENGTH; index++) {
        const position = Math.floor(Math.random() * ALPHABET.length);
        suffix += ALPHABET.charAt(position);
    }
    return suffix;
}

/*
 * The only generator of rule ids (R294): `r` and 12 random lowercase alphanumeric characters,
 * retried until the id is not among `existing`. Called when a rule is added, and at load for a
 * stored rule that has no usable id (R314); never on reorder.
 */
export const createRuleId = (existing: string[]): string => {
    let id = `r${createSuffix()}`;
    while (existing.includes(id)) {
        id = `r${createSuffix()}`;
    }
    return id;
};
