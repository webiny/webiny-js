import { useEffect, useState } from "react";
import { plugins } from "@webiny/plugins";
import { generateId } from "@webiny/utils";
import { AddQuerySelectionPlugin } from "@webiny/app/plugins/AddQuerySelectionPlugin";
import { DocumentNode } from "graphql";

interface Props {
    operationName: string;
    selectionPath: string;
    addSelection: DocumentNode;
}

export const AddGraphQLQuerySelection = (props: Props) => {
    const [name] = useState(`AddGraphQLQuerySelection:${props.operationName}:${generateId()}`);

    useEffect(() => {
        const plugin = new AddQuerySelectionPlugin(props);

        plugin.name = name;
        plugins.register(plugin);

        return () => {
            plugins.unregister(name);
        };
    }, []);

    return null;
};
