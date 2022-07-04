import { ApplicationGraphQL, ApplicationGraphQLBody } from "./ApplicationGraphQL";
import { ApwContentTypes, ApwScheduleActionData, ApwScheduleActionTypes } from "~/scheduler/types";
import { ApwSettings } from "~/scheduler/handlers/utils";

const PB_PAGE_DATA_FIELD = /* GraphQL */ `
    {
        id
        pid
        editor
        category {
            slug
        }
        version
        title
        path
        url
        content
        savedOn
        status
        locked
        publishedOn
        locked
        revisions {
            id
            status
            locked
            version
        }
        settings {
            general {
                snippet
                tags
                layout
                image {
                    id
                    src
                }
            }
            social {
                meta {
                    property
                    content
                }
                title
                description
                image {
                    id
                    src
                }
            }
            seo {
                title
                description
                meta {
                    name
                    content
                }
            }
        }
        createdFrom
        createdOn
        createdBy {
            id
            displayName
            type
        }
    }
`;

const ERROR_FIELD = /* GraphQL */ `
    {
        code
        data
        message
    }
`;

const PUBLISH_MUTATION = /* GraphQL */ `
    mutation PublishPage($id: ID!) {
        pageBuilder {
            publishPage(id: $id) {
                data ${PB_PAGE_DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;

const UNPUBLISH_MUTATION = /* GraphQL */ `
    mutation UnpublishPage($id: ID!) {
        pageBuilder {
            unpublishPage(id: $id) {
                data ${PB_PAGE_DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;

interface ApplicationGraphQLBodyVariables {
    id: string;
}

export class PageBuilderGraphQL extends ApplicationGraphQL {
    public override name = "apw.scheduler.applicationGraphQL.pageBuilder";

    public override canUse(data: ApwScheduleActionData): boolean {
        return data.type === ApwContentTypes.PAGE;
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
        return {
            query: PUBLISH_MUTATION,
            variables: {
                id: data.entryId
            }
        };
    }

    private getUnpublishBody(
        data: ApwScheduleActionData
    ): ApplicationGraphQLBody<ApplicationGraphQLBodyVariables> {
        return {
            query: UNPUBLISH_MUTATION,
            variables: {
                id: data.entryId
            }
        };
    }
}
