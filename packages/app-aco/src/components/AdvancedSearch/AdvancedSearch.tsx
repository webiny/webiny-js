import React, { useCallback, useState } from "react";
import { useApolloClient } from "@apollo/react-hooks";

import { QueryManager } from "~/components/AdvancedSearch/QueryManager/QueryManager";
import {
    FieldRaw,
    FiltersGraphQLGateway,
    QueryObjectRepository
} from "~/components/AdvancedSearch/QueryObject";

import { Button } from "./Button";
import { Drawer } from "./Drawer";

interface AdvancedSearchProps {
    fields: FieldRaw[];
    modelId: string;
    onSubmit: (data: any) => void;
}

export const AdvancedSearch = ({ fields, modelId, onSubmit }: AdvancedSearchProps) => {
    // TODO: create presenter for AdvancedSearch to handle these piece of state
    // TODO: create repository to handle selected filter
    const client = useApolloClient();
    const [repository] = useState(
        QueryObjectRepository.getInstance(new FiltersGraphQLGateway(client), modelId)
    );

    const [openManager, setOpenManager] = useState(false);
    const [openBuilder, setOpenBuilder] = useState(false);

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

    const onQueryManagerEdit = (callback?: () => any) => {
        setOpenManager(false);
        setOpenBuilder(true);
        callback && callback();
    };

    const onQueryManagerCreate = (callback?: () => any) => {
        setOpenManager(false);
        setOpenBuilder(true);
        callback && callback();
    };

    return (
        <>
            <Button onClick={() => setOpenManager(true)} />
            <QueryManager
                // TODO: rename it
                repository={repository}
                onClose={() => setOpenManager(false)}
                onEdit={onQueryManagerEdit}
                onCreate={onQueryManagerCreate}
                onSelect={onQueryManagerSelect}
                open={openManager}
            />
            <Drawer
                // TODO: add the full queryObject prop to pass to presenter
                fields={fields}
                repository={repository}
                onClose={() => setOpenBuilder(false)}
                onSubmit={onQueryBuilderSubmit}
                open={openBuilder}
            />
        </>
    );
};
