import { CompressionHandler } from "@webiny/utils/exports/api.js";
import { ModelFieldCompression as ModelFieldCompressionAbstraction } from "./abstractions.js";
import type { CmsModelField } from "~/types/index.js";
import { BuildParams } from "@webiny/api-core/features/buildParams/index.js";

class ModelFieldCompressionImpl implements ModelFieldCompressionAbstraction.Interface {
    public constructor(
        private readonly compressionHandler: CompressionHandler.Interface,
        private readonly buildParams: BuildParams.Interface
    ) {}

    public async compress(
        fields: CmsModelField[]
    ): ModelFieldCompressionAbstraction.CompressResponse {
        if (!this.buildParams.get<boolean>("ContentModelFieldCompression")) {
            return fields;
        }
        return this.compressionHandler.compress(fields);
    }

    public async decompress(
        data: ModelFieldCompressionAbstraction.DecompressParams
    ): ModelFieldCompressionAbstraction.DecompressResponse {
        if (Array.isArray(data)) {
            return data as CmsModelField[];
        }
        return this.compressionHandler.decompress<CmsModelField[]>(data);
    }
}

export const ModelFieldCompression = ModelFieldCompressionAbstraction.createImplementation({
    implementation: ModelFieldCompressionImpl,
    dependencies: [CompressionHandler, BuildParams]
});
