import { useEffect, useMemo, useState } from "react";
import { SchedulerGetGraphQLGateway } from "~/admin/components/ContentEntries/Scheduler/adapters/SchedulerGetGraphQLGateway.js";
import { useApolloClient } from "~/admin/hooks/index.js";
import type { SchedulerEntry } from "@webiny/app-headless-cms-scheduler/types.js";
import type { ISchedulerGetExecuteParams } from "@webiny/app-headless-cms-scheduler";

export interface IUseGetItemParams extends ISchedulerGetExecuteParams {}

interface IState {
    item: SchedulerEntry | null;
    error: Error | null;
}

export const useGetSchedulerItem = (params: IUseGetItemParams) => {
    const client = useApolloClient();

    const [state, setState] = useState<IState>({
        item: null,
        error: null
    });

    const gateway = useMemo(() => {
        return new SchedulerGetGraphQLGateway(client);
    }, [client]);

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
