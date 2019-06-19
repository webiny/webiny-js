//@flow
import * as React from "react";
import { css } from "emotion";
import { Form } from "webiny-app-forms/components/Form";

const pageInnerWrapper = css({
    overflowY: "scroll",
    overflowX: "hidden",
    maxHeight: "calc(100vh - 290px)",
    position: "relative",
    padding: 25
});

type Props = {
    form: Object
};

const FormPreview = ({ form }: Props) => {
    return <div className={pageInnerWrapper}>{form && <Form preview id={form.id} />}</div>;
};

export default FormPreview;
