import { CompressionPlugin } from "@webiny/api-elasticsearch";

export class FaultyDecompressorPlugin extends CompressionPlugin {
    public canCompress(): boolean {
        return true;
    }
    public compress(): Promise<any> {
        throw new Error("Throwing an error on purpose - compress.");
    }
    public canDecompress(): boolean {
        return true;
    }
    public decompress(): Promise<any> {
        throw new Error("Throwing an error on purpose - decompress.");
    }
}
