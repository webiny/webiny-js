import React from "react";
import { css } from "emotion";
import { useFormEditor } from "../../Context";
import { Elevation } from "@webiny/ui/Elevation";
import { Form } from "../../../../../components/Form";

const formPreviewWrapper = css({
    padding: 40,
    backgroundColor: "var(--webiny-theme-color-surface, #fff) !important",
    margin: 40,
    boxSizing: "border-box"
});

export const PreviewTab = () => {
    const { data } = useFormEditor();

    return (
        <Elevation z={1} className={formPreviewWrapper}>
            <Form preview data={data} />
        </Elevation>
    );
};
