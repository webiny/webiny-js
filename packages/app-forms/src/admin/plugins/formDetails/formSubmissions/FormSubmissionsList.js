//@flow
import * as React from "react";
import FormSubmissionsListComponent from "./FormSubmissionsList/FormSubmissionsList";
import { withDataList } from "@webiny/app/components";
import { get } from "lodash";
import { LIST_FORM_SUBMISSIONS } from "@webiny/app-forms/admin/viewsGraphql";

type Props = {
    form: Object,
    dataList: Object
};

const FormSubmissionsList = (props: Props) => {
    return (
        <div>
            <FormSubmissionsListComponent {...props} />
        </div>
    );
};

export default withDataList({
    query: LIST_FORM_SUBMISSIONS,
    response: data => {
        return get(data, "forms.listFormSubmissions", {});
    },
    variables(props: Object) {
        return { sort: { savedOn: -1 }, where: { "form.parent": props.form.parent } };
    }
})(FormSubmissionsList);
