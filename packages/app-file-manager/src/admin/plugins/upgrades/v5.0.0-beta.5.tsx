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
    mutation UpgradeFileManager($version: String!) {
        fileManager {
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
                    version: "5.0.0-beta.5"
                }
            })
            .then(({ data }) => {
                setLoading(false);
                const { error } = data.fileManager.upgrade;
                if (error) {
                    setError(error.message);
                    return;
                }

                // Just so the user sees the actual message.
                setTimeout(onInstalled, 3000);
            });
    }, []);

    const label = error ? (
        <Alert title={t`Something went wrong`} type={"danger"}>
            {error}
        </Alert>
    ) : (
        t`Upgrading File Manager...`
    );

    return (
        <SimpleForm>
            {loading && <CircularProgress label={label} />}
            <SimpleFormHeader title={"Upgrade File Manager"} />
            <SimpleFormContent>
                <Grid>
                    <Cell span={12}>
                        <Typography use={"body1"} tag={"div"}>
                            This upgrade will do the following:
                            <ul>
                                <li>
                                    insert Elasticsearch records into a dedicated DynamoDB table
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
