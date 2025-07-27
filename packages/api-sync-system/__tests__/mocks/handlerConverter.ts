import { createHandlerConverter } from "~/sync/handler/HandlerConverter";
import { NullCommandValue } from "~/sync/handler/converter/commands/NullCommandValue";
import type { ICommandConverter } from "~/sync/types";
import type { NonEmptyArray } from "@webiny/api/types";
import { createBatchGetCommandConverter } from "~/sync/handler/converter/BatchGetCommandConverter";
import { createGetCommandConverter } from "~/sync/handler/converter/GetCommandConverter";
import { createBatchWriteCommandConverter } from "~/sync/handler/converter/BatchWriteCommandConverter";
import { createPutCommandConverter } from "~/sync/handler/converter/PutCommandConverter";
import { createDeleteCommandConverter } from "~/sync/handler/converter/DeleteCommandConverter";
import { createUpdateCommandConverter } from "~/sync/handler/converter/UpdateCommandConverter";
import { createQueryCommandConverter } from "~/sync/handler/converter/QueryCommandConverter";
import { createScanCommandConverter } from "~/sync/handler/converter/ScanCommandConverter";

export interface ICreateMockHandlerConverterCommandParams {
    commandConverters: NonEmptyArray<ICommandConverter> | "all";
}

export const createMockHandlerConverter = (params?: ICreateMockHandlerConverterCommandParams) => {
    const converter = createHandlerConverter({
        defaultValue: new NullCommandValue()
    });
    if (!params?.commandConverters) {
        return converter;
    }

    const commandConverters =
        params.commandConverters === "all"
            ? [
                  createBatchGetCommandConverter(),
                  createGetCommandConverter(),
                  createQueryCommandConverter(),
                  createScanCommandConverter(),
                  createBatchWriteCommandConverter(),
                  createPutCommandConverter(),
                  createDeleteCommandConverter(),
                  createUpdateCommandConverter()
              ]
            : params.commandConverters;

    converter.register(commandConverters);

    return converter;
};
