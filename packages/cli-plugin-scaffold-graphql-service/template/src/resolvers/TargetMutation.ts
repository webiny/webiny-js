import { NotFoundResponse, ErrorResponse, Response } from "@webiny/handler-graphql";
import { ApplicationContext, Target } from "~/types";
import defaults from "./defaults";

export interface CreateTargetArgs {
    data: {
        title: string;
        description?: string;
    };
}

export interface UpdateTargetArgs {
    id: string;
    data: {
        title: string;
        description?: string;
    };
}

export interface DeleteTargetArgs {
    id: string;
}

interface TargetMutation {
    createTarget(params: CreateTargetArgs): Promise<ErrorResponse | Response<Target>>;
    updateTarget(params: UpdateTargetArgs): Promise<ErrorResponse | Response<Target>>;
    deleteTarget(params: DeleteTargetArgs): Promise<ErrorResponse | Response<Target>>;
}

export default class TargetMutationResolver implements TargetMutation {
    private readonly context: ApplicationContext;

    constructor(context: ApplicationContext) {
        this.context = context;
    }

    async createTarget({ data }: CreateTargetArgs) {
        const { db } = this.context;
        await db.create({
            ...defaults.db,
            data
        });

        return new Response(data);
    }

    async updateTarget({ id, data }: UpdateTargetArgs) {
        const { db } = this.context;
        const entry = await db.read({
            ...defaults.db,
            query: {
                PK: "Target",
                SK: id
            }
        });

        if (!entry) {
            return new NotFoundResponse(`Target "${id}" not found.`);
        }

        await db.update({
            ...defaults.db,
            query: {
                PK: "Target",
                SK: id
            }
        });

        if (locale.default) {
            await target.locales.updateDefault(args.code);
        }

        return new Response(locale);
    }

    async deleteTarget({ id }: DeleteTargetArgs) {
        const { db } = this.context;
        const entry = await db.read({
            ...defaults.db,
            query: {
                PK: "Target",
                SK: id
            }
        });

        if (!entry) {
            return new NotFoundResponse(`Target "${id}" not found.`);
        }

        await db.delete({
            ...defaults.db,
            query: {
                PK: "Target",
                SK: id
            }
        });

        return new Response(locale);
    }
}
