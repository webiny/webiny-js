import React, { useEffect } from "react";
import { plugins } from "@webiny/plugins";
import { nanoid } from "nanoid";
import { AddQuerySelectionPlugin } from "@webiny/app/plugins/AddQuerySelectionPlugin";
import { DocumentNode } from "graphql";

interface Props {
    operationName: string;
    selectionPath: string;
    addSelection: DocumentNode;
}

export const AddGraphQLQuerySelection: React.VFC<Props> = props => {
    useEffect(() => {
        const plugin = new AddQuerySelectionPlugin(props);

        const name = nanoid();
        plugin.name = name;
        plugins.register(plugin);

        return () => {
            plugins.unregister(name);
        };
    }, []);

    return null;
};
