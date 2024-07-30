import bytes from "bytes";

export interface ISegment {
    start: number;
    end: number;
}

export const createSizeSegments = (
    initialSize: number,
    segmentSizeInput: `${number}${string}`
): ISegment[] => {
    const segmentSize = bytes.parse(segmentSizeInput);
    let sizeLeft = initialSize;
    let end = 0;

    const segments: ISegment[] = [];

    while (sizeLeft > 0) {
        const start = end;
        end = end + (segmentSize > sizeLeft ? sizeLeft : segmentSize);

        segments.push({
            start,
            end
        });
        sizeLeft = sizeLeft - segmentSize;
    }

    return segments;
};
