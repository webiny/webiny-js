export const createListTaskLogsQuery = () => {
    return /* GraphQL */ `
        query ListTaskLogs(
            $where: WebinyBackgroundTaskLogListWhereInput
            $sort: [WebinyBackgroundTaskLogListSorter!]
            $limit: Int
            $after: String
        ) {
            backgroundTasks {
                listLogs(where: $where, sort: $sort, limit: $limit, after: $after) {
                    data {
                        id
                        createdOn
                        createdBy {
                            id
                            displayName
                            type
                        }
                        task {
                            id
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
