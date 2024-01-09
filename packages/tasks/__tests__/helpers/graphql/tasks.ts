export const createListTasksQuery = () => {
    return /* GraphQL */ `
        query ListTasks(
            $where: WebinyBackgroundTaskListWhereInput
            $sort: [WebinyBackgroundTaskListSorter!]
            $limit: Int
            $after: String
        ) {
            backgroundTasks {
                listTasks(where: $where, sort: $sort, limit: $limit, after: $after) {
                    data {
                        id
                        definitionId
                        name
                        taskStatus
                        createdOn
                        savedOn
                        eventResponse
                        createdBy {
                            id
                            displayName
                            type
                        }
                        startedOn
                        finishedOn
                        input
                        logs {
                            id
                            createdOn
                            createdBy {
                                id
                                displayName
                                type
                            }
                            executionName
                            iteration
                            items {
                                message
                                createdOn
                                type
                                data
                                error
                            }
                        }
                    }
                    meta {
                        cursor
                        hasMoreItems
                        totalCount
                    }
                    error {
                        message
                        code
                        data
                    }
                }
            }
        }
    `;
};
