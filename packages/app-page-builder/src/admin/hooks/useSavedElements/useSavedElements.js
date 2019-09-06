// @flow
import { useState } from "react";
import { useQuery } from "react-apollo";
import { get } from "dot-prop-immutable";
import { listElements } from "@webiny/app-page-builder/admin/graphql/pages";
import createElementPlugin from "../../utils/createElementPlugin";
import createBlockPlugin from "../../utils/createBlockPlugin";

export const useSavedElements = () => {
    const [ready, setReady] = useState(false);

    const { data, loading } = useQuery(listElements, { skip: ready });

    if (ready) {
        return true;
    }

    if (loading) {
        return false;
    }

    const elements = get(data, "pageBuilder.elements.data");
    if (!ready) {
        elements.forEach(el => {
            if (el.type === "element") {
                createElementPlugin(el);
            } else {
                createBlockPlugin(el);
            }
        });
        setReady(true);
    }

    return ready;
};
