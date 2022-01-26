import { useState } from "react";
import { useQuery } from "@apollo/react-hooks";
import { get } from "dot-prop-immutable";
import { LIST_PAGE_ELEMENTS } from "../../graphql/pages";
import createElementPlugin from "../../utils/createElementPlugin";
import createBlockPlugin, { BlockElement } from "../../utils/createBlockPlugin";
import { PbEditorElement } from "~/types";

export const useSavedElements = (): boolean => {
    const [ready, setReady] = useState(false);

    const { data, loading } = useQuery(LIST_PAGE_ELEMENTS, { skip: ready });

    if (ready) {
        return true;
    }

    if (loading) {
        return false;
    }

    /**
     * These are the types which can be attached to elements, but it is probably wrong.
     * TODO @ts-refactor
     */
    const elements: (PbEditorElement | BlockElement)[] =
        get(data, "pageBuilder.listPageElements.data") || [];
    if (!ready) {
        elements.forEach(el => {
            if (el.type === "element") {
                createElementPlugin(el as PbEditorElement);
                return;
            }
            createBlockPlugin(el as BlockElement);
        });
        setReady(true);
    }

    return ready;
};
