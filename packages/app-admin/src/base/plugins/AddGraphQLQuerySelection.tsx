import { FC, useEffect } from "react";
import { plugins } from "@webiny/plugins";
import { nanoid } from "nanoid";
import { AddQuerySelectionPlugin } from "@webiny/app/plugins/AddQuerySelectionPlugin";
import { DocumentNode } from "graphql";

interface Props {
    operationName: string;
    selectionPath: string;
    addSelection: DocumentNode;
}

export const AddGraphQLQuerySelection: FC<Props> = props => {
    useEffect(() => {
        const plugin = new AddQuerySelectionPlugin(props);

        plugin.name = nanoid();
        plugins.register(plugin);

        return () => {
            plugins.unregister(plugin.name);
        };
    }, []);

    return null;
};
