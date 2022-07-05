/**
 * Used when we need to create an ID of some data record.
 * Or, for example, when adding the revision record to the DynamoDB table.
 */
export const zeroPad = (version: string | number, amount = 4): string => {
    return `${version}`.padStart(amount, "0");
};
