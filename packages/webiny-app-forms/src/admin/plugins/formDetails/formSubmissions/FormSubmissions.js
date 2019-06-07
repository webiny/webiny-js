//@flow
import * as React from "react";
import { css } from "emotion";
import RenderElement from "webiny-app-cms/render/components/Element";

const pageInnerWrapper = css({
    overflowY: "scroll",
    overflowX: "hidden",
    height: "calc(100vh - 230px)",
    position: "relative"
});

type Props = {
    form: Object
};

const FormSubmissions = ({ form }: Props) => {
    return (
        <div className={pageInnerWrapper}>
            <RenderElement element={form.content} />
        </div>
    );
};

export default FormSubmissions;
