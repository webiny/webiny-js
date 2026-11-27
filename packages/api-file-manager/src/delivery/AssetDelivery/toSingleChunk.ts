/**
 * Contents already in memory, as the one chunk of a stream. For an `AssetContentsReader` whose
 * `readStream` has nothing to stream from: a resized image, or a buffer handed to it.
 */
export async function* toSingleChunk(contents: Buffer): AsyncIterable<Uint8Array> {
    yield contents;
}
