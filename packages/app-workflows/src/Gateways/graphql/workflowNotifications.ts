import gql from "graphql-tag";
import type { IWorkflowNotification } from "~/types.js";
import type { IWorkflowError } from "~/Gateways/index.js";

const ERROR_FIELD = /* GraphQL */ `
    error {
        code
        message
        data
    }
`;

const WORKFLOW_NOTIFICATION = /* GraphQL */ `
    {
        id
        title
    }
`;

export interface IListWorkflowNotificationsResponse {
    workflows: {
        listWorkflowNotifications: {
            data: IWorkflowNotification[] | null;
            error: IWorkflowError | null;
        };
    };
}

export const LIST_WORKFLOW_NOTIFICATIONS_QUERY = gql`
    query ListWorkflows {
        workflows {
            listWorkflowNotifications {
                data ${WORKFLOW_NOTIFICATION}
                ${ERROR_FIELD}
            }
        }
    }
`;
