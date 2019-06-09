// @flow
import React from "react";
import styled from "react-emotion";
import { useFormEditor } from "webiny-app-forms/admin/components/FormEditor/Context";
import { Elevation } from "webiny-ui/Elevation";
import { Form } from "webiny-app-forms/components/Form";

const Container = styled("div")({
    padding: "40px 60px",
    background: "white"
});

export const PreviewTab = () => {
    const { data } = useFormEditor();

    return (
        <Elevation z={1}>
            <Container>
                <Form preview data={data} />
            </Container>
        </Elevation>
    );
};
