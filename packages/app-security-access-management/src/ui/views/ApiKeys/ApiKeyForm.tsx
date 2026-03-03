import React, { useCallback, useEffect } from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import get from "lodash/get.js";
import isEmpty from "lodash/isEmpty.js";
import { i18n } from "@webiny/app/i18n/index.js";
import { Bind, Form, useForm, useGenerateSlug } from "@webiny/form";
import {
    EmptyView,
    Permissions,
    SimpleForm,
    SimpleFormContent,
    SimpleFormFooter,
    SimpleFormHeader,
    useRouter
} from "@webiny/app-admin";
import { validation } from "@webiny/validation";
import { ReactComponent as AddIcon } from "@webiny/icons/add.svg";
import { ReactComponent as CopyIcon } from "@webiny/icons/content_copy.svg";
import { ReactComponent as PasteIcon } from "@webiny/icons/content_paste.svg";
import { ReactComponent as SettingsIcon } from "@webiny/icons/settings.svg";
import { pickDataForCreate, pickDataForUpdate } from "./utils.js";
import type {
    ICreateApiKeyResponse,
    IReadApiKeyResponse,
    IUpdateApiKeyResponse
} from "./graphql.js";
import * as GQL from "./graphql.js";
import type { ApiKey } from "~/types.js";
import {
    Alert,
    Button,
    CopyButton,
    Grid,
    Icon,
    IconButton,
    Input,
    Label,
    OverlayLoader,
    Textarea,
    Tooltip,
    useToast
} from "@webiny/admin-ui";
import { Routes } from "~/routes.js";
import type { GenericRecord } from "@webiny/app/types.js";

const t = i18n.ns("app-security-admin-users/admin/api-keys/form");

interface ApiKeyFormProps {
    newEntry: boolean;
    id: string | undefined;
}

export const ApiKeyForm = ({ id, newEntry }: ApiKeyFormProps) => {
    const { goToRoute } = useRouter();
    const toast = useToast();

    const getQuery = useQuery<IReadApiKeyResponse>(GQL.READ_API_KEY, {
        variables: { id },
        skip: !id
        /*
        onCompleted: data => {
            if (!data) {
                return;
            }

            const { error } = data.security.apiKey;
            if (!error) {
                return;
            }
            goToRoute(Routes.ApiKeys.List);
            toast.showWarningToast({ title: error.message });
        }
        */
    });
    /**
     * Replaces the toast part above - commented out because there is no onCompleted callback anymore.
     */
    useEffect(() => {
        if (!getQuery.data) {
            return;
        }

        const { error } = getQuery.data.security.apiKey;
        if (!error) {
            return;
        }
        goToRoute(Routes.ApiKeys.List);
        toast.showWarningToast({ title: error.message });
    }, [getQuery.data, goToRoute, toast]);

    const [create, createMutation] = useMutation<ICreateApiKeyResponse>(GQL.CREATE_API_KEY, {
        refetchQueries: [{ query: GQL.LIST_API_KEYS }]
    });

    const [update, updateMutation] = useMutation<IUpdateApiKeyResponse>(GQL.UPDATE_API_KEY, {
        refetchQueries: [{ query: GQL.LIST_API_KEYS }]
    });

    const loading = [getQuery, createMutation, updateMutation].find(item => item.loading);

    const onSubmit = useCallback(
        async (formData: ApiKey) => {
            if (!formData.permissions || !formData.permissions.length) {
                toast.showWarningToast({
                    title: t`You must configure permissions before saving!`,
                    duration: Infinity
                });
                return;
            }

            const isUpdate = formData.createdOn;
            const [operation, args] = isUpdate
                ? [update, { variables: { id: formData.id, data: pickDataForUpdate(formData) } }]
                : [create, { variables: { data: pickDataForCreate(formData) } }];

            const response = await operation(args);

            const { error } = response.data!.security.apiKey;
            if (error) {
                toast.showWarningToast({ title: error.message });
                return;
            }

            const { id } = response.data!.security.apiKey.data!;

            if (!isUpdate) {
                goToRoute(Routes.ApiKeys.List, { id });
            }

            toast.showSuccessToast({ title: t`API key saved successfully.` });
        },
        [id]
    );

    const data = get(getQuery, "data.security.apiKey.data", {}) as ApiKey;

    const showEmptyView = !newEntry && !loading && isEmpty(data);

    if (showEmptyView) {
        return (
            <EmptyView
                icon={<SettingsIcon />}
                title={t`Click on the left side list to display API key details or create a...`}
                action={
                    <Button
                        icon={<AddIcon />}
                        text={t`New API Key`}
                        data-testid="new-record-button"
                        onClick={() => {
                            goToRoute(Routes.ApiKeys.List, { new: true });
                        }}
                    />
                }
            />
        );
    }

    return (
        <Form data={data} onSubmit={onSubmit}>
            {({ data, form, Bind }) => {
                return (
                    <SimpleForm size={"lg"}>
                        {loading && <OverlayLoader />}
                        <SimpleFormHeader title={data.name ? data.name : "Untitled"} />
                        <SimpleFormContent>
                            <FormContent newEntry={newEntry} />
                        </SimpleFormContent>
                        <SimpleFormHeader title={"Permissions"} rounded={false}>
                            <div className={"flex justify-end"}>
                                <CopyPermissionsToJson permissions={data.permissions} />
                            </div>
                        </SimpleFormHeader>
                        <SimpleFormContent>
                            <Grid>
                                <Grid.Column span={12}>
                                    <Bind name={"permissions"} defaultValue={[]}>
                                        {bind => <Permissions id={data.id || "new"} {...bind} />}
                                    </Bind>
                                </Grid.Column>
                            </Grid>
                        </SimpleFormContent>
                        <SimpleFormFooter>
                            <Button
                                variant={"secondary"}
                                text={t`Cancel`}
                                onClick={() => {
                                    goToRoute(Routes.ApiKeys.List);
                                }}
                                data-testid="sam.key.new.form.button.cancel"
                            />
                            <Button
                                text={t`Save`}
                                data-testid="sam.key.new.form.button.save"
                                onClick={form.submit}
                            />
                        </SimpleFormFooter>
                    </SimpleForm>
                );
            }}
        </Form>
    );
};

interface FormContentProps {
    newEntry: boolean;
}

const FormContent = (props: FormContentProps) => {
    const { newEntry } = props;
    const form = useForm();
    const toast = useToast();
    const { generateSlug } = useGenerateSlug(form, "name", "slug");
    const data = form.data;

    return (
        <Grid>
            <Grid.Column span={6}>
                <Bind name="name" validators={validation.create("required")}>
                    <Input
                        label={t`Name`}
                        data-testid="sam.key.new.form.name"
                        onBlur={generateSlug}
                    />
                </Bind>
            </Grid.Column>
            <Grid.Column span={6}>
                <Bind name="slug" validators={validation.create("required")}>
                    <Input
                        label={t`Slug`}
                        data-testid="sam.key.new.form.name"
                        disabled={!newEntry}
                    />
                </Bind>
            </Grid.Column>
            <Grid.Column span={12}>
                <Bind name="description" validators={validation.create("required")}>
                    <Textarea
                        size={"lg"}
                        label={t`Description`}
                        rows={4}
                        data-testid="sam.key.new.form.description"
                    />
                </Bind>
            </Grid.Column>
            <Grid.Column span={12}>
                <div>
                    <Label text={t`Token`} />
                    {data.token ? (
                        <div
                            className={
                                "py-sm pl-sm-extra pr-xs rounded-md mt-xs bg-neutral-disabled flex justify-between items-center"
                            }
                        >
                            <div>{data.token}</div>
                            <CopyButton
                                variant={"ghost"}
                                value={data.token}
                                onCopy={() => {
                                    toast.showSuccessToast({ title: "Successfully copied!" });
                                }}
                            />
                        </div>
                    ) : (
                        <Alert className={"mt-xs"}>
                            {"Your token will be shown once you submit the form."}
                        </Alert>
                    )}
                </div>
            </Grid.Column>
        </Grid>
    );
};

interface CopyPermissionsToJsonProps {
    permissions: GenericRecord[];
}

const CopyPermissionsToJson = ({ permissions }: CopyPermissionsToJsonProps) => {
    const toast = useToast();

    return (
        <Tooltip
            content="Copy permissions as JSON"
            trigger={
                <IconButton
                    variant={"ghost"}
                    icon={<CopyIcon />}
                    onClick={() => {
                        navigator.clipboard.writeText(JSON.stringify(permissions, null, 2));
                        toast.showToast({
                            title: "JSON data copied to clipboard.",
                            icon: <Icon icon={<PasteIcon />} label={"Paste"} />
                        });
                    }}
                />
            }
        />
    );
};
