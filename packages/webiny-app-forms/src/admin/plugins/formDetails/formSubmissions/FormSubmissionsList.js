//@flow
import * as React from "react";
import FormSubmissionsListComponent from "./FormSubmissionsList/FormSubmissionsList";
import { compose } from "recompose";
import { withDataList } from "webiny-app/components";
import { get } from "lodash";
import { listFormSubmissions } from "webiny-app-forms/admin/viewsGraphql";

type Props = {
    form: Object,
    dataList: Object
};

const FormSubmissionsList = ({ dataList }: Props) => {
    return (
        <div>
            <FormSubmissionsListComponent dataList={dataList} />
        </div>
    );
};

export default compose(
    withDataList({
        query: listFormSubmissions,
        response: data => {
            return get(data, "forms.listFormSubmissions", {});
        },
        variables(props: Object) {
            return { sort: { savedOn: -1 }, where: { "form.parent": props.form.parent } };
        }
    })
)(FormSubmissionsList);
