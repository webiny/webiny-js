import { get, set } from "lodash";
import { FbFormRenderComponentProps } from "@webiny/app-form-builder/types";
import { SAVE_FORM_VIEW } from "./graphql";
import { ApolloClient } from "apollo-client";

const saveFormView = ({ data, client }: FbFormRenderComponentProps) => {
    // SSR?
    if (!window || !data) {
        return;
    }

    if (get(window, "localStorage.form_view_" + data.id)) {
        return;
    }

    set(window, "localStorage.form_view_" + data.id, 1);
    client.mutate({
        mutation: SAVE_FORM_VIEW,
        variables: {
            revision: data.id
        }
    });
};

export default (props: FbFormRenderComponentProps & { client: ApolloClient<any> }) => {
    const { data, preview } = props;
    if (!data || preview) {
        return;
    }

    saveFormView(props);
};
