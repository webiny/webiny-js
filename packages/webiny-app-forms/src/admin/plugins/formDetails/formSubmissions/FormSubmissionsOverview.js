//@flow
import * as React from "react";

type Props = {
    form: Object
};

const FormSubmissionsOverview = ({ form }: Props) => {
    return (
        <div>
            <div>Views: {form.stats.views}</div>
            <div>Submissions: {form.stats.submissions}</div>
            <div>Conversion Rate: {form.stats.conversionRate}%</div>
        </div>
    );
};

export default FormSubmissionsOverview;
