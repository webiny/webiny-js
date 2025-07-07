import { createSyncHandler, type IHandlerParams } from "~/sync/handler/Handler.js";
import { createMockSystem } from "~tests/mocks/system.js";
import { createMockHandlerConverter } from "~tests/mocks/handlerConverter.js";
import { createFilterOutRecord } from "~/sync/FilterOutRecord";
import { createDefaultFilterOutRecordPlugins } from "~/sync/filter/createDefaultFilterOutRecordPlugins.js";

export interface ICreateMockSyncHandlerParams extends Omit<IHandlerParams, "converter"> {
    converter: "all" | IHandlerParams["converter"];
}

export const createMockSyncHandler = (
    params: Partial<ICreateMockSyncHandlerParams> &
        Pick<ICreateMockSyncHandlerParams, "getEventBridgeClient">
) => {
    const converter =
        params.converter === "all"
            ? createMockHandlerConverter({
                  commandConverters: "all"
              })
            : params.converter || createMockHandlerConverter();
    return createSyncHandler({
        getEventBridgeClient: () => {
            return params.getEventBridgeClient();
        },
        system: params.system || createMockSystem(),
        converter,
        eventBus: params.eventBus || {
            arn: "unknown",
            name: "default-event-bus"
        },
        filterOutRecord:
            params.filterOutRecord || createFilterOutRecord(createDefaultFilterOutRecordPlugins())
    });
};
