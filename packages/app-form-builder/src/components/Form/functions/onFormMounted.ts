import { get, set } from "lodash";
import { FbFormRenderComponentProps } from "~/types";
import {
    SAVE_FORM_VIEW,
    SaveFormViewMutationResponse,
    SaveFormViewMutationVariables
} from "./graphql";
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
    client.mutate<SaveFormViewMutationResponse, SaveFormViewMutationVariables>({
        mutation: SAVE_FORM_VIEW,
        variables: {
            revision: data.id
        }
    });
};

export default (props: FbFormRenderComponentProps & { client: ApolloClient<any> }): void => {
    const { data, preview } = props;
    if (!data || preview) {
        return;
    }

    saveFormView(props);
};
