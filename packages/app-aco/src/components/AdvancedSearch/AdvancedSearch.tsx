import React, { useCallback, useState } from "react";

import { Button } from "./Button";
import { Drawer } from "./Drawer";

import { FieldRaw, QueryObjectDTO } from "./QueryBuilder/domain";
import { QueryManager } from "~/components/AdvancedSearch/QueryManager/QueryManager";

interface AdvancedSearchProps {
    fields: FieldRaw[];
    modelId: string;
    onSubmit: (data: any) => void;
}

export const AdvancedSearch = ({ fields, modelId, onSubmit }: AdvancedSearchProps) => {
    const [openManager, setOpenManager] = useState(false);
    const [openBuilder, setOpenBuilder] = useState(false);
    const [queryObject, setQueryObject] = useState<QueryObjectDTO>();

    const onQueryBuilderSubmit = useCallback(
        data => {
            // Close the drawer on submission
            setOpenBuilder(false);
            onSubmit && onSubmit(data);
        },
        [onSubmit]
    );

    const onQueryManagerSelect = useCallback(
        data => {
            // Close the dialog on submission
            setOpenManager(false);
            onSubmit && onSubmit(data);
        },
        [onSubmit]
    );

    const onQueryManagerEdit = (data?: QueryObjectDTO) => {
        setQueryObject(data);
        setOpenManager(false);
        setOpenBuilder(true);
    };

    const onQueryManagerCreate = () => {
        setQueryObject(undefined);
        setOpenManager(false);
        setOpenBuilder(true);
    };

    return (
        <>
            <Button onClick={() => setOpenManager(true)} />
            <QueryManager
                modelId={modelId}
                open={openManager}
                onClose={() => setOpenManager(false)}
                onEdit={onQueryManagerEdit}
                onCreate={onQueryManagerCreate}
                onSelect={onQueryManagerSelect}
            />
            <Drawer
                open={openBuilder}
                onClose={() => setOpenBuilder(false)}
                fields={fields}
                modelId={modelId}
                onSubmit={onQueryBuilderSubmit}
                existing={queryObject}
            />
        </>
    );
};
