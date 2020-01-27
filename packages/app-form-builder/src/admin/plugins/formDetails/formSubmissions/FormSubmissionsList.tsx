import * as React from "react";
import FormSubmissionsListComponent from "./FormSubmissionsList/FormSubmissionsList";
import { LIST_FORM_SUBMISSIONS } from "@webiny/app-form-builder/admin/viewsGraphql";
import { useDataList } from "@webiny/app/hooks/useDataList";
import { FbFormModel } from "@webiny/app-form-builder/types";

type Props = {
    form: FbFormModel;
};

const FormSubmissionsList = (props: Props) => {
    const dataList = useDataList({
        useRouter: false,
        query: LIST_FORM_SUBMISSIONS,
        variables() {
            return { sort: { savedOn: -1 }, where: { "form.parent": props.form.parent } };
        }
    });

    return (
        <div>
            <FormSubmissionsListComponent dataList={dataList} {...props} />
        </div>
    );
};

export default FormSubmissionsList;
