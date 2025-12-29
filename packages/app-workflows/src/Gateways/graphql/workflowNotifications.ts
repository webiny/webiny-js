import gql from "graphql-tag";
import type { IWorkflowNotificationType } from "~/types.js";
import type { IWorkflowError } from "~/Gateways/index.js";

const ERROR_FIELD = /* GraphQL */ `
    error {
        code
        message
        data
    }
`;

const WORKFLOW_NOTIFICATION_TYPE = /* GraphQL */ `
    {
        id
        title
    }
`;

export interface IListWorkflowNotificationTypesResponse {
    workflows: {
        listWorkflowNotificationTypes: {
            data: IWorkflowNotificationType[] | null;
            error: IWorkflowError | null;
        };
    };
}

export const LIST_WORKFLOW_NOTIFICATION_TYPES_QUERY = gql`
    query ListWorkflowNotificationTypes {
        workflows {
            listWorkflowNotificationTypes {
                data ${WORKFLOW_NOTIFICATION_TYPE}
                ${ERROR_FIELD}
            }
        }
    }
`;
