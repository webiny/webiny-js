export const createListTasksQuery = () => {
    return /* GraphQL */ `
        query ListTasks(
            $where: WebinyTaskListWhereInput
            $sort: [WebinyTaskListSorter!]
            $limit: Int
            $after: String
        ) {
            backgroundTasks {
                listTasks(where: $where, sort: $sort, limit: $limit, after: $after) {
                    data {
                        id
                        definitionId
                        name
                        status
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
                        values
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
