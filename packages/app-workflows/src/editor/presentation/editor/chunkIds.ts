// Splits a list into chunks of at most `size`, keeping the order (the server caps an `ids` lookup at 200).
export const chunkIds = <T>(items: T[], size: number): T[][] => {
    const chunks: T[][] = [];
    for (let index = 0; index < items.length; index += size) {
        chunks.push(items.slice(index, index + size));
    }
    return chunks;
};
