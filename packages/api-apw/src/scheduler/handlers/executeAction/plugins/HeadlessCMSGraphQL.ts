import {
    ApplicationGraphQL,
    ApplicationGraphQLBody,
    ApwSettings,
    ApplicationGraphQLGetUrlParams,
    ApwScheduleActionData
} from "./ApplicationGraphQL";
import { ApwContentTypes, ApwScheduleActionTypes } from "~/scheduler/types";
import WebinyError from "@webiny/error";
import upperFirst from "lodash/upperFirst";

const META_FIELDS = `
    title
    version
    locked
    status
`;

const ERROR_FIELD = `
    {
        code
        data
        message
    }
`;

const createPublishMutation = (modelId: string): string => {
    const ucFirstModelId = upperFirst(modelId);

    return `
        mutation CmsPublish${ucFirstModelId}($revision: ID!) {
            content: publish${ucFirstModelId}(revision: $revision) {
                data {
                    id
                    lastPublishedOn
                    meta {
                        ${META_FIELDS}
                    }
                }
                error ${ERROR_FIELD}
            }
        }`;
};

const createUnpublishMutation = (modelId: string) => {
    const ucFirstModelId = upperFirst(modelId);

    return `
        mutation CmsUnpublish${ucFirstModelId}($revision: ID!) {
            content: unpublish${ucFirstModelId}(revision: $revision) {
                data {
                    id
                    lastPublishedOn
                    meta {
                        ${META_FIELDS}
                    }
                }
                error ${ERROR_FIELD}
            }
        }`;
};

interface ApplicationGraphQLBodyVariables {
    revision: string;
}

export class HeadlessCMSGraphQL extends ApplicationGraphQL {
    public override name = "apw.scheduler.applicationGraphQL.headlessCms";

    public override canUse(data: ApwScheduleActionData): boolean {
        return data.type === ApwContentTypes.CMS_ENTRY;
    }

    public override getUrl({ locale }: ApplicationGraphQLGetUrlParams): string {
        return `/cms/manage/${locale}`;
    }

    public override getArn(settings: ApwSettings): string {
        return settings.mainGraphqlFunctionArn;
    }

    public override getGraphQLBody(data: ApwScheduleActionData): ApplicationGraphQLBody | null {
        switch (data.action) {
            case ApwScheduleActionTypes.PUBLISH:
                return this.getPublishBody(data);
            case ApwScheduleActionTypes.UNPUBLISH:
                return this.getUnpublishBody(data);
            default:
                return null;
        }
    }

    private getPublishBody(
        data: ApwScheduleActionData
    ): ApplicationGraphQLBody<ApplicationGraphQLBodyVariables> {
        if (!data.modelId) {
            throw new WebinyError(
                "Missing model ID in the schedule action data.",
                "SCHEDULE_ACTION_ERROR",
                {
                    data
                }
            );
        }
        return {
            query: createPublishMutation(data.modelId),
            variables: {
                revision: data.entryId
            }
        };
    }

    private getUnpublishBody(
        data: ApwScheduleActionData
    ): ApplicationGraphQLBody<ApplicationGraphQLBodyVariables> {
        if (!data.modelId) {
            throw new WebinyError(
                "Missing model ID in the schedule action data.",
                "SCHEDULE_ACTION_ERROR",
                {
                    data
                }
            );
        }
        return {
            query: createUnpublishMutation(data.modelId),
            variables: {
                revision: data.entryId
            }
        };
    }
}
