import { useState } from "react";

export const useDataListModal = () => {
    const [sort, setSort] = useState<string>();
    const [filter, setFilter] = useState<string>();
    const [status, setStatus] = useState<string>();

    return {
        sort,
        setSort,
        filter,
        setFilter,
        status,
        setStatus
    };
};
