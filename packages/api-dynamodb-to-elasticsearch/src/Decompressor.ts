import { IDecompressor } from "./types";
import { decompress } from "@webiny/api-elasticsearch";
import { GenericRecord } from "@webiny/cli/types";
import { PluginsContainer } from "@webiny/plugins";

export interface IDecompressorParams {
    plugins: PluginsContainer;
}

export class Decompressor implements IDecompressor {
    private readonly plugins: PluginsContainer;

    public constructor(params: IDecompressorParams) {
        this.plugins = params.plugins;
    }

    public async decompress(data: GenericRecord): Promise<GenericRecord | null> {
        try {
            return await decompress(this.plugins, data);
        } catch (ex) {
            return null;
        }
    }
}
