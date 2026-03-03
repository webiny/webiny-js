import React, { useMemo } from "react";
import { useQuery } from "@apollo/client/react";
import { useBind } from "@webiny/form";
import { Select } from "@webiny/ui/Select/index.js";
import { type IListUsersResponse, LIST_USERS } from "~/graphql.js";
import type { User } from "~/types.js";

const getValidFilterValue = (value: string): string | undefined => {
    if (value === "all" || value === "") {
        return undefined;
    }
    return value;
};

export const FilterByInitiator = () => {
    const { data: listUsers } = useQuery<IListUsersResponse>(LIST_USERS);
    const bind = useBind({
        name: "data.initiator",
        beforeChange(value, cb) {
            cb(getValidFilterValue(value));
        }
    });

    const options = useMemo(() => {
        const users: User[] = listUsers?.adminUsers?.users?.data || [];

        return [
            { label: "All", value: "all" },
            ...users.map(user => ({ label: `${user.firstName} ${user.lastName}`, value: user.id }))
        ];
    }, [listUsers]);

    return (
        <Select {...bind} size={"medium"} placeholder={"Filter by Initiator"} options={options} />
    );
};
