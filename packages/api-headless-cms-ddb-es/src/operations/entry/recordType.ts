export const createRecordType = (): string => {
    return "cms.entry";
};
export const createLatestRecordType = (): string => {
    return `${createRecordType()}.l`;
};
export const createPublishedRecordType = (): string => {
    return `${createRecordType()}.p`;
};
