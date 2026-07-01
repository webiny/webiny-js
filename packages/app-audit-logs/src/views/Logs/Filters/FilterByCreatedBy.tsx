import React, { useEffect, useMemo, useState } from "react";
import { useContainer } from "@webiny/app";
import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient";
import { useBind } from "@webiny/form";
import { Select } from "@webiny/admin-ui";
import { LIST_USERS } from "~/graphql.js";
import type { User } from "~/types.js";

interface ListUsersResponse {
    adminUsers: {
        users: {
            data: User[];
        };
    };
}

const getValidFilterValue = (value: string): string | undefined => {
    if (value === "all" || value === "") {
        return undefined;
    }
    return value;
};

export const FilterByCreatedBy = () => {
    const container = useContainer();
    const client = container.resolve(MainGraphQLClient);
    const [users, setUsers] = useState<User[]>([]);

    useEffect(() => {
        client.execute<ListUsersResponse>({ query: LIST_USERS }).then(response => {
            setUsers(response.adminUsers.users.data || []);
        });
    }, []);

    const bind = useBind({
        name: "createdBy",
        beforeChange(value, cb) {
            cb(getValidFilterValue(value));
        }
    });

    const options = useMemo(() => {
        return [
            { label: "All", value: "all" },
            ...users.map(user => ({ label: `${user.firstName} ${user.lastName}`, value: user.id }))
        ];
    }, [users]);

    return <Select {...bind} size={"md"} placeholder={"Filter by Initiator"} options={options} />;
};
