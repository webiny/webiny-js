import { Plugin } from "@webiny/plugins/Plugin";
import { ApwScheduleActionData } from "~/scheduler/types";
import { ApwSettings } from "~/scheduler/handlers/utils";

export interface ApplicationGraphQLBody<T = Record<string, any>> {
    query: string;
    variables: T;
}

export abstract class ApplicationGraphQL extends Plugin {
    public static override readonly type: string = "apw.scheduler.applicationGraphQL";

    public abstract canUse(data: ApwScheduleActionData): boolean;

    public abstract getArn(settings: ApwSettings): string;

    public abstract getGraphQLBody(data: ApwScheduleActionData): ApplicationGraphQLBody | null;
}
