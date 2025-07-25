import { CompressionPlugin, type ICompressedValue } from "../CompressionPlugin";
import { compress, decompress } from "~/compression/jsonpack";

const JSONPACK = "jsonpack";

export class JsonpackCompression extends CompressionPlugin {
    public override name = "utils.compression.jsonpack";

    public override canCompress(data: any): boolean {
        if (typeof data !== "object") {
            return false;
        } else if (!!data.compression) {
            return false;
        }
        // TODO Do we want to compress anything with jsonpack anymore? Maybe not...
        return false;
    }

    public override async compress(data: any): Promise<ICompressedValue> {
        if (data === null || data === undefined) {
            return data;
        }
        const value = await compress(data);

        return {
            compression: JSONPACK,
            value
        };
    }

    public override canDecompress(data: Partial<ICompressedValue>): boolean {
        if (typeof data !== "object") {
            return false;
        } else if (!data?.compression) {
            return false;
        }

        const compression = data.compression as string;
        return compression.toLowerCase() === JSONPACK;
    }

    public override async decompress(data: ICompressedValue): Promise<any> {
        if (!data) {
            return data;
        } else if (!data.value) {
            return null;
        }
        try {
            return await decompress(data.value);
        } catch (ex) {
            console.log(`Could not decompress given data.`, ex.message);
            return null;
        }
    }
}

export const createJsonpackCompression = () => {
    return new JsonpackCompression();
};
