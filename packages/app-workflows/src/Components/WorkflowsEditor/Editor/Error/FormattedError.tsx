import React from "react";
import type { IWorkflowError } from "~/Gateways/index.js";
import { Grid, Heading } from "@webiny/admin-ui";
import type { IWorkflowErrorDataInvalidFields } from "~/Gateways/abstraction/WorkflowsGateway.js";

interface IInvalidFieldsProps {
    invalidFields: IWorkflowErrorDataInvalidFields;
}
const InvalidFields = ({ invalidFields }: IInvalidFieldsProps) => {
    return (
        <>
            {Object.keys(invalidFields).map((fieldKey, index) => {
                const field = invalidFields[fieldKey];
                return (
                    <Grid.Column span={12} key={index}>
                        <Heading level={6}>{field.message}</Heading>
                        <pre>{fieldKey}</pre>
                    </Grid.Column>
                );
            })}
        </>
    );
};

interface IFormattedErrorProps {
    error: IWorkflowError;
}
export const FormattedError = ({ error }: IFormattedErrorProps) => {
    const invalidFields: IWorkflowErrorDataInvalidFields = error.data?.invalidFields || {};
    return (
        <Grid>
            <Grid.Column span={12}>
                <Heading level={6}>Message</Heading>
                {error.message}
            </Grid.Column>
            <Grid.Column span={12}>
                <Heading level={6}>Code</Heading>
                {error.code}
            </Grid.Column>
            <Grid.Column span={12}>
                <Heading level={6}>Fields</Heading>
            </Grid.Column>
            <InvalidFields invalidFields={invalidFields} />
        </Grid>
    );
};
