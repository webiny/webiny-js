import React, { useMemo } from "react";
import { useQuery } from "@apollo/react-hooks";

import { useBind } from "@webiny/form";
import { Select } from "@webiny/ui/Select";

import { LIST_USERS } from "~/graphql";
import { User } from "~/types";

const getValidFilterValue = (value: string): string | undefined => {
    if (value === "all" || value === "") {
        return undefined;
    }
    return value;
};

export const FilterByInitiator: React.FC = () => {
    const { data: listUsers } = useQuery(LIST_USERS);
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
