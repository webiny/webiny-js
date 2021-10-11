import React, { useCallback, useState } from "react";
import gql from "graphql-tag";
import { i18n } from "@webiny/app/i18n";
import {
    SimpleForm,
    SimpleFormContent,
    SimpleFormFooter,
    SimpleFormHeader
} from "@webiny/app-admin/components/SimpleForm";
import { useApolloClient } from "@apollo/react-hooks";
import { Alert } from "@webiny/ui/Alert";
import { CircularProgress } from "@webiny/ui/Progress";
import { Cell, Grid } from "@webiny/ui/Grid";
import { ButtonPrimary } from "@webiny/ui/Button";
import { Typography } from "@webiny/ui/Typography";

const t = i18n.ns("app-headless-cms/admin/installation");

const UPGRADE = gql`
    mutation UpgradeFormBuilder($version: String!) {
        formBuilder {
            upgrade(version: $version) {
                data
                error {
                    code
                    message
                    data
                }
            }
        }
    }
`;

const Upgrade = ({ onInstalled }) => {
    const client = useApolloClient();
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const startUpgrade = useCallback(async () => {
        setLoading(true);
        await client
            .mutate({
                mutation: UPGRADE,
                variables: {
                    version: "5.16.0"
                }
            })
            .then(({ data }) => {
                setLoading(false);
                const { error } = data.formBuilder.upgrade;
                if (error) {
                    setError(error.message);
                    return;
                }

                onInstalled();
            });
    }, []);

    const label = error ? (
        <Alert title={t`Something went wrong`} type={"danger"}>
            {error}
        </Alert>
    ) : (
        t`Upgrading Form Builder...`
    );

    return (
        <SimpleForm>
            {loading && <CircularProgress label={label} />}
            <SimpleFormHeader title={"Upgrade Form Builder"} />
            <SimpleFormContent>
                <Grid>
                    <Cell span={12}>
                        <Typography use={"body1"} tag={"div"}>
                            This upgrade will do the following:
                            <ul>
                                <li>
                                    add `formId` and `webinyVersion` fields to DynamoDB form records
                                </li>
                            </ul>
                        </Typography>
                    </Cell>
                </Grid>
            </SimpleFormContent>
            <SimpleFormFooter>
                <ButtonPrimary onClick={startUpgrade}>Upgrade</ButtonPrimary>
            </SimpleFormFooter>
        </SimpleForm>
    );
};

export default Upgrade;
