import React from "react";
import { useRecoilState } from "recoil";
import gql from "graphql-tag";
import useDeepCompareEffect from "use-deep-compare-effect";
import { useCms } from "@webiny/app-headless-cms/admin/hooks";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { pageAtom } from "../../recoil/modules/page";
import { SnackbarAction } from "@webiny/ui/Snackbar";

const parseValue = (type, value) => {
    switch (type) {
        case "Number":
            return value.includes(".") ? parseFloat(value) : parseInt(value);
        case "Float":
            return parseFloat(value);
        case "Long":
        case "Int":
            return parseInt(value);
        default:
            return value;
    }
};

const LoadDataSources: React.FunctionComponent = () => {
    const { createApolloClient } = useCms();
    const { showSnackbar } = useSnackbar();
    const [pageAtomValue, setPageAtomValue] = useRecoilState(pageAtom);
    const { dataSources } = pageAtomValue.settings;

    const runQuery = async (client, ds) => {
        const variables = {};
        for (const v of ds.config.variables) {
            if (!v.previewValue || v.previewValue === "") {
                throw new Error(`Missing preview value for variable "${v.name}"!`);
            }
            variables[v.name] = parseValue(v.type, v.previewValue);
        }

        const { data } = await client.query({
            query: gql(ds.config.query),
            variables
        });

        return data;
    };

    const loadDataSources = async (dataSources = []) => {
        const ds = dataSources.find(ds => ds.id === "get-entry");
        if (!ds) {
            return;
        }
        const client = createApolloClient({ uri: ds.config.url });
        try {
            const result = await runQuery(client, ds);
            setPageAtomValue(page => ({
                ...page,
                dataSources: [{ id: ds.id, type: ds.type, name: ds.name, data: result }]
            }));
        } catch (e) {
            showSnackbar(
                <span>
                    <strong>Failed to load datasource &quot;{ds.name}&quot;</strong>
                    <br />
                    {e.message}
                </span>,
                {
                    timeout: 60000,
                    dismissesOnAction: true,
                    action: <SnackbarAction label={"OK"} />
                }
            );
        }
    };

    useDeepCompareEffect(() => {
        loadDataSources(dataSources);
    }, [dataSources]);

    return null;
};

export default LoadDataSources;
