//@flow
import * as React from "react";
import FormSubmissionsList from "./FormSubmissionsList/FormsSubmissionsList";
import { compose } from "recompose";
import { withDataList } from "webiny-app/components";
import { get } from "lodash";
import { listFormSubmissions } from "./FormSubmissionsList/graphql";

type Props = {
    form: Object,
    dataList: Object
};

const FormSubmissionsOverview = ({ dataList, form }: Props) => {
    return (
        <div>
            <FormSubmissionsList form={form} dataList={dataList}/>
        </div>
    );
};

export default compose(
    withDataList({
        query: listFormSubmissions,
        response: data => {
            return get(data, "forms.listFormSubmissions", {});
        },
        variables: {
            sort: { savedOn: -1 }
        }
    })
)(FormSubmissionsOverview);
