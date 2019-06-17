// @flow
import { get, set } from "lodash";
import type { FormRenderComponentPropsType } from "webiny-app-forms/types";
import { SAVE_FORM_VIEW } from "./graphql";

const saveFormView = ({ data, client }: FormRenderComponentPropsType) => {
    // SSR?
    if (!window || !data) {
        return;
    }

    if (get(window, "localStorage.form_view_" + data.id)) {
        // return;
    }

    set(window, "localStorage.form_view_" + data.id);
    client.mutate({
        mutation: SAVE_FORM_VIEW,
        variables: {
            id: data.id
        }
    });
};

export default (props: FormRenderComponentPropsType) => {
    const { data, preview } = props;
    /*if (!data || preview ) {
        return;
    }*/

    saveFormView(props);
};
