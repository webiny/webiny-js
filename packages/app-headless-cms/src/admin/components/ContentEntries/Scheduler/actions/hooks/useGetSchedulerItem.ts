import { useEffect, useState } from "react";
import type { SchedulerEntry } from "@webiny/app-headless-cms-scheduler/types.js";
import type {
    ISchedulerGetExecuteParams,
    ISchedulerGetGateway
} from "@webiny/app-headless-cms-scheduler";

export interface IUseGetItemParams extends ISchedulerGetExecuteParams {
    gateway: ISchedulerGetGateway;
}

interface IState {
    item: SchedulerEntry | null;
    error: Error | null;
}

export const useGetSchedulerItem = (params: IUseGetItemParams) => {
    const { gateway } = params;
    const [state, setState] = useState<IState>({
        item: null,
        error: null
    });

    useEffect(() => {
        if (!params.id || !params.modelId) {
            return;
        }
        (async () => {
            try {
                const result = await gateway.execute(params);
                setState({
                    item: result.item,
                    error: null
                });
            } catch (ex) {
                setState({
                    error: ex,
                    item: null
                });
            }
        })();
    }, [params.id, params.modelId, gateway]);

    return state;
};
