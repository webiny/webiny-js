import get from "lodash/get";
import set from "lodash/set";
import { FbFormRenderComponentProps } from "~/types";
import {
    SAVE_FORM_VIEW,
    SaveFormViewMutationResponse,
    SaveFormViewMutationVariables
} from "./graphql";

const saveFormView = ({ data, client }: Required<FbFormRenderComponentProps>) => {
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

export default (props: Required<FbFormRenderComponentProps>): void => {
    const { data, preview } = props;
    if (!data || preview) {
        return;
    }

    saveFormView(props);
};
