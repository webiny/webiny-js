import { IndexManager } from "~/settings";
import { IDataSynchronizationInput } from "~/tasks/dataSynchronization/types";
import { Context } from "~/types";
import { Manager } from "~/tasks/Manager";
import { Response, TaskResponse } from "@webiny/tasks";
import { createMockEvent } from "~tests/mocks/event";
import { createTaskManagerStoreMock } from "~tests/mocks/store";

export interface ICreateManagersParams {
    context: Context;
}

export const createManagers = (params: ICreateManagersParams) => {
    const { context } = params;
    const manager = new Manager<IDataSynchronizationInput>({
        elasticsearchClient: context.elasticsearch,
        // @ts-expect-error
        documentClient: context.db.driver.documentClient,
        response: new TaskResponse(new Response(createMockEvent())),
        context,
        isAborted: () => {
            return false;
        },
        isCloseToTimeout: () => {
            return false;
        },
        store: createTaskManagerStoreMock()
    });

    const indexManager = new IndexManager(context.elasticsearch, {});
    return {
        manager,
        indexManager
    };
};
