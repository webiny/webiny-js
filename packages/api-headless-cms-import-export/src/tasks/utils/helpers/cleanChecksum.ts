export const cleanChecksum = (input: string): string => {
    return input.replaceAll('"', "");
};
