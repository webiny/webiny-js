import React, { useCallback } from "react";
import styled from "@emotion/styled";
import { useMutation, useQuery } from "@apollo/react-hooks";
import pick from "lodash/pick";

import { i18n } from "@webiny/app/i18n";
import { Form } from "@webiny/form";
import { Grid, Cell } from "@webiny/ui/Grid";
import { ButtonPrimary } from "@webiny/ui/Button";
import { CircularProgress } from "@webiny/ui/Progress";
import { SimpleFormContent } from "@webiny/app-admin/components/SimpleForm";
import { validation } from "@webiny/validation";
import { useRouter } from "@webiny/react-router";
import { Input } from "@webiny/ui/Input";
import { Select } from "@webiny/ui/Select";
import { Checkbox } from "@webiny/ui/Checkbox";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { Dialog, DialogCancel, DialogTitle, DialogActions, DialogContent } from "@webiny/ui/Dialog";

import {
    LIST_PAGE_BLOCKS_AND_CATEGORIES,
    LIST_BLOCK_CATEGORIES,
    UPDATE_PAGE_BLOCK,
    UpdatePageBlockMutationResponse,
    UpdatePageBlockMutationVariables
} from "./graphql";
import { PbPageBlock, PbBlockCategory } from "~/types";

const t = i18n.ns("app-page-builder/admin/page-blocks/form");

const ButtonWrapper = styled("div")({
    display: "flex",
    justifyContent: "space-between",
    width: "100%"
});

interface PageBlocksFormProps {
    pageBlocksData: PbPageBlock[];
    refetch: () => {};
}

const PageBlocksForm: React.FC<PageBlocksFormProps> = ({ pageBlocksData, refetch }) => {
    const { history } = useRouter();
    const { showSnackbar } = useSnackbar();

    const id = new URLSearchParams(location.search).get("id");
    const category = new URLSearchParams(location.search).get("category");

    const listQuery = useQuery(LIST_BLOCK_CATEGORIES);
    const blockCategories: PbBlockCategory[] =
        listQuery?.data?.pageBuilder?.listBlockCategories?.data || [];

    const [update, updateMutation] = useMutation<
        UpdatePageBlockMutationResponse,
        UpdatePageBlockMutationVariables
    >(UPDATE_PAGE_BLOCK, {
        refetchQueries: [{ query: LIST_PAGE_BLOCKS_AND_CATEGORIES }], //To update block counters on the left side
        onCompleted: () => refetch()
    });

    const onSubmit = useCallback(
        async formData => {
            const data = pick(formData, ["name", "blockCategory"]);

            const response = await update({
                variables: { id: id as string, data }
            });

            const error = response?.data?.pageBuilder?.pageBlock?.error;
            if (error) {
                showSnackbar(error.message);
                return;
            }

            history.push(`/page-builder/page-blocks?category=${category}`);

            showSnackbar(t`Block saved successfully.`);
        },
        [id]
    );

    const data = pageBlocksData.find(pageBlock => pageBlock.id === id);

    const loading = [updateMutation].find(item => item.loading);

    return (
        <Dialog
            open={id !== null}
            onClose={() => history.push(`/page-builder/page-blocks?category=${category}`)}
        >
            <Form data={data} onSubmit={onSubmit}>
                {({ form, Bind }) => (
                    <>
                        {loading && <CircularProgress />}
                        <DialogTitle>Edit Block</DialogTitle>
                        <DialogContent>
                            <SimpleFormContent>
                                <Grid>
                                    <Cell span={6}>
                                        <Bind
                                            name="name"
                                            validators={validation.create("required")}
                                        >
                                            <Input label={t`Title`} />
                                        </Bind>
                                    </Cell>
                                    <Cell span={6}>
                                        <Bind
                                            name="blockCategory"
                                            validators={[validation.create("required")]}
                                        >
                                            <Select label={t`Category`}>
                                                {blockCategories.map((blockCategory, index) => (
                                                    <option key={index} value={blockCategory.slug}>
                                                        {blockCategory.name}
                                                    </option>
                                                ))}
                                            </Select>
                                        </Bind>
                                    </Cell>
                                    <Cell span={12}>
                                        <Bind name="global">
                                            <Checkbox label={t`Global`} />
                                        </Bind>
                                    </Cell>
                                </Grid>
                            </SimpleFormContent>
                        </DialogContent>
                        <DialogActions>
                            <ButtonWrapper>
                                <DialogCancel
                                    onClick={() =>
                                        history.push(
                                            `/page-builder/page-blocks?category=${category}`
                                        )
                                    }
                                >
                                    Cancel
                                </DialogCancel>
                                <ButtonPrimary
                                    onClick={ev => {
                                        form.submit(ev);
                                    }}
                                >
                                    Save Block
                                </ButtonPrimary>
                            </ButtonWrapper>
                        </DialogActions>
                    </>
                )}
            </Form>
        </Dialog>
    );
};

export default PageBlocksForm;
