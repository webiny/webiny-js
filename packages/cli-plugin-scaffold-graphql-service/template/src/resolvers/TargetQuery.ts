import { NotFoundResponse, NotFoundError, Response, ListResponse } from "@webiny/handler-graphql";
import { ApplicationContext, Target } from "~/types";
import defaults from "./defaults";

interface GetTargetParams {
    id: string;
}

interface ListTargetsParams {
    sort?: string[];
    limit?: number;
    after?: string;
}

interface ListTargetsMeta {
    cursor: string | null;
    hasAfter: boolean;
}

interface TargetQuery {
    getTarget(params: GetTargetParams): Promise<Response<Target>>;
    listTargets(params: ListTargetsParams): Promise<ListResponse<Target, ListTargetsMeta>>;
}

export default class TargetQueryResolver implements TargetQuery {
    private readonly context: ApplicationContext;

    constructor(context: ApplicationContext) {
        this.context = context;
    }

    async getTarget({ id }) {
        const { db } = this.context;
        const [[target]] = await db.read<Target>({
            ...defaults.db,
            query: {
                PK: "Target",
                SK: id
            }
        });

        if (!target) {
            throw new NotFoundError(`Target "${id}" not found.`);
        }

        return new Response(target);
    }

    async listTargets(params) {
        const { db } = this.context;

        // TODO: finish this
        const [targets] = await db.read<Target>({
            ...defaults.db,
            query: {
                PK: "Target",
                SK: { $lt: params.after }
            }
        });

        return new ListResponse(targets, {
            cursor: "xyz",
            hasAfter: true
        });
    }
}
