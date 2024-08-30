import bytes from "bytes";

export interface ISegment {
    start: number;
    end: number;
}

export const createSizeSegments = (
    fileSize: number,
    segmentSizeInput: `${number}${string}` | number
): ISegment[] => {
    const segmentSize =
        typeof segmentSizeInput === "number" ? segmentSizeInput : bytes.parse(segmentSizeInput);

    const segments: ISegment[] = [];
    let segmentIndex = 0;
    for (let start = 0; start < fileSize; start += segmentSize + 1) {
        const end = start + segmentSize > fileSize ? fileSize : start + segmentSize;
        segments[segmentIndex] = {
            start,
            end
        };
        segmentIndex++;
    }

    return segments;
};
