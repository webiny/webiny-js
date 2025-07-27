import type {
    ICommandValue,
    ICommandValueItem,
    ICommandValueItemExtended,
    IDynamoDbCommand,
    IHandler,
    IHandlerConverter,
    ISystem
} from "../types.js";
import type {
    EventBridgeClient,
    PutEventsCommandInput,
    PutEventsCommandOutput
} from "@webiny/aws-sdk/client-eventbridge";
import { PutEventsCommand } from "@webiny/aws-sdk/client-eventbridge";
import { convertException } from "@webiny/utils";
import { generateAlphaNumericId } from "@webiny/utils/generateId.js";
import type { IDetail } from "~/sync/handler/types.js";
import type { NonEmptyArray } from "@webiny/api/types.js";
import type { FilterOutRecord } from "~/sync/FilterOutRecord.js";

export interface IHandlerEventBus {
    name: string;
    arn: string;
}

export interface IHandlerParams {
    getEventBridgeClient(): Pick<EventBridgeClient, "send">;
    converter: IHandlerConverter;
    eventBus: IHandlerEventBus;
    system: ISystem;
    filterOutRecord: FilterOutRecord;
}

export class Handler implements IHandler {
    public readonly id = generateAlphaNumericId();
    private readonly system: ISystem;
    private readonly getEventBridgeClient: () => Pick<EventBridgeClient, "send">;
    private commands: ICommandValue[] = [];
    private readonly converter: IHandlerConverter;
    private readonly eventBus: IHandlerEventBus;
    private readonly filterOutRecord: FilterOutRecord;

    public constructor(params: IHandlerParams) {
        this.getEventBridgeClient = params.getEventBridgeClient;
        this.system = params.system;
        this.converter = params.converter;
        this.eventBus = params.eventBus;
        this.filterOutRecord = params.filterOutRecord;
    }

    public add(input: IDynamoDbCommand): void {
        const cmd = this.converter.convert(input);
        this.commands.push(cmd);
    }

    public async flush(): Promise<PutEventsCommandOutput | null> {
        const items = this.createEventBusEvent();

        if (!items?.length) {
            return null;
        }

        const detail: IDetail = {
            /**
             * We need a random ID because there can be multiple commands with same items sent - but that does not mean they are duplicates.
             */
            id: generateAlphaNumericId(),
            items,
            source: this.system
        };

        const input: PutEventsCommandInput = {
            Entries: [
                {
                    DetailType: "synchronization-input",
                    Detail: JSON.stringify(detail),
                    Source: `webiny:${this.system.name}`,
                    EventBusName: this.eventBus.name
                }
            ]
        };
        const command = new PutEventsCommand(input);

        try {
            const eventBridgeClient = this.getEventBridgeClient();
            return await eventBridgeClient.send(command);
        } catch (ex) {
            console.log("Could not send events to Sync System EventBridge.");
            console.error(ex.message);
            console.error(convertException(ex, ["message"]));
            console.log(
                JSON.stringify({
                    event: items
                })
            );
            throw ex;
        }
    }

    private createEventBusEvent(): NonEmptyArray<ICommandValueItem> | null {
        const commands = Array.from(this.commands);
        /**
         * Remove all existing commands so we can start fresh.
         */
        this.commands = [];
        const everything = commands.reduce<ICommandValueItem[]>((items, cmd) => {
            const commandItems = cmd.getItems();
            if (!commandItems?.length) {
                return items;
            }

            for (const item of commandItems) {
                if (this.filterOutRecord.filterOut(item)) {
                    continue;
                }
                items.push({
                    tableName: item.tableName,
                    command: item.command,
                    tableType: item.tableType,
                    PK: item.PK,
                    SK: item.SK
                });
            }

            return items;
        }, []);

        return everything.length === 0
            ? null
            : (everything as NonEmptyArray<ICommandValueItemExtended>);
    }
}

export const createSyncHandler = (params: IHandlerParams): IHandler => {
    return new Handler(params);
};
