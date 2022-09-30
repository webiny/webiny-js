import React, { useCallback } from "react";
import gql from "graphql-tag";
import { css } from "emotion";
import get from "lodash/get";
import lodashUpperFirst from "lodash/upperFirst";
import lodashCamelCase from "lodash/camelCase";
import { useRouter } from "@webiny/react-router";
import { Form } from "@webiny/form";
import { Input } from "@webiny/ui/Input";
import { Select } from "@webiny/ui/Select";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { CircularProgress } from "@webiny/ui/Progress";
import { validation } from "@webiny/validation";
import { useQuery, useMutation, useApolloClient } from "~/admin/hooks";
import { i18n } from "@webiny/app/i18n";
import { ButtonPrimary } from "@webiny/ui/Button";
import * as UID from "@webiny/ui/Dialog";
import { Grid, Cell } from "@webiny/ui/Grid";
import { addModelToGroupCache, addModelToListCache } from "./cache";
import * as GQL from "~/admin/viewsGraphql";
import {
    CreateCmsModelMutationResponse,
    CreateCmsModelMutationVariables,
    ListMenuCmsGroupsQueryResponse
} from "~/admin/viewsGraphql";
import { CmsGroup } from "~/types";
import { CmsGroupOption } from "./types";

const t = i18n.ns("app-headless-cms/page-templates/new-content-model-dialog");

const narrowDialog = css`
    .mdc-dialog__surface {
        width: 600px;
        min-width: 600px;
    }
`;

const noPadding = css`
    padding: 5px !important;
`;

/**
 * This list is to disallow creating models that might interfere with GraphQL schema creation.
 * Add more if required.
 */
const disallowedModelIdEndingList: string[] = ["Response", "List", "Meta", "Input", "Sorter"];

export interface NewContentModelDialogProps {
    open: boolean;
    onClose: UID.DialogOnClose;
}

const SCHEMA_TYPES = gql`
    query ListSchemaTypes {
        __schema {
            types {
                name
            }
        }
    }
`;

interface SchemaTypes {
    __schema: {
        types: { name: string }[];
    };
}

interface CmsModelData {
    name: string;
    description: string;
    group: string;
}

const NewContentModelDialog: React.FC<NewContentModelDialogProps> = ({ open, onClose }) => {
    const [loading, setLoading] = React.useState(false);
    const { showSnackbar } = useSnackbar();
    const { history } = useRouter();
    const client = useApolloClient();

    const [createContentModel] = useMutation<
        CreateCmsModelMutationResponse,
        CreateCmsModelMutationVariables
    >(GQL.CREATE_CONTENT_MODEL, {
        update(cache, { data }) {
            if (!data) {
                setLoading(false);
                showSnackbar("Missing data on Create Content Model Mutation Response.");
                return;
            }
            const { data: model, error } = data.createContentModel;

            if (error) {
                setLoading(false);
                showSnackbar(error.message);
                return;
            }

            addModelToListCache(cache, model);
            addModelToGroupCache(cache, model);

            history.push("/cms/page-templates/" + model.modelId);
        }
    });

    const listMenuGroupsQuery = useQuery<ListMenuCmsGroupsQueryResponse>(
        GQL.LIST_MENU_CONTENT_GROUPS_MODELS,
        {
            skip: !open
        }
    );

    const contentModelGroups = get(listMenuGroupsQuery, "data.listContentModelGroups.data", []).map(
        (item: CmsGroup): CmsGroupOption => {
            return {
                value: item.id,
                label: item.name
            };
        }
    );

    const nameValidator = useCallback(
        async (name: string): Promise<boolean> => {
            const target = (name || "").trim();
            if (!target.charAt(0).match(/[a-zA-Z]/)) {
                throw new Error("Model name can't start with a number.");
            }

            for (const ending of disallowedModelIdEndingList) {
                const re = new RegExp(`${ending}$`, "i");
                const matched = target.match(re);
                if (matched === null) {
                    continue;
                }
                throw new Error(`Model must not end with "${ending}".`);
            }

            // Validate GraphQL Schema type
            const { data } = await client.query<SchemaTypes>({
                query: SCHEMA_TYPES,
                fetchPolicy: "network-only"
            });

            const types = data.__schema.types.map(t => t.name);

            const modelId = lodashUpperFirst(lodashCamelCase(name));

            if (types.includes(modelId)) {
                throw new Error(
                    `"${name}" type already exists in the GraphQL schema. Please pick a different name.`
                );
            }

            return true;
        },
        [client]
    );

    const group = contentModelGroups?.length > 0 ? contentModelGroups[0].value : null;

    const onSubmit = async (data: CmsModelData) => {
        setLoading(true);
        await createContentModel({
            variables: { data }
        });
    };

    return (
        <UID.Dialog
            open={open}
            onClose={onClose}
            className={narrowDialog}
            data-testid="cms-new-content-model-modal"
        >
            {open && (
                <Form
                    data={{ group, tags: ["type:pageTemplate"] }}
                    onSubmit={data => {
                        /**
                         * We are positive that data is CmsModelData.
                         */
                        onSubmit(data as unknown as CmsModelData);
                    }}
                >
                    {({ Bind, submit }) => (
                        <>
                            {loading && <CircularProgress label={"Creating page template..."} />}
                            <UID.DialogTitle>{t`New Page Template`}</UID.DialogTitle>
                            <UID.DialogContent>
                                <Grid className={noPadding}>
                                    <Cell span={12}>
                                        <Bind
                                            name={"name"}
                                            validators={[
                                                validation.create("required,maxLength:100"),
                                                nameValidator
                                            ]}
                                        >
                                            <Input
                                                label={t`Name`}
                                                description={t`The name of the page template. Use the singular form, e.g. Person, not Persons.`}
                                                data-testid="cms.newcontentmodeldialog.name"
                                            />
                                        </Bind>
                                    </Cell>
                                    <Cell span={12}>
                                        <Bind
                                            name={"group"}
                                            validators={validation.create("required")}
                                        >
                                            <Select
                                                description={t`Choose a page template group`}
                                                label={t`Content model group`}
                                                options={contentModelGroups}
                                                data-testid="cms.newcontentmodeldialog.selectgroup"
                                            />
                                        </Bind>
                                    </Cell>
                                    <Cell span={12}>
                                        <Bind name="description">
                                            {props => (
                                                <Input
                                                    {...props}
                                                    rows={4}
                                                    maxLength={200}
                                                    characterCount
                                                    label={t`Description`}
                                                    data-testid="cms.newcontentmodeldialog.description"
                                                />
                                            )}
                                        </Bind>
                                    </Cell>
                                </Grid>
                            </UID.DialogContent>
                            <UID.DialogActions>
                                <ButtonPrimary
                                    onClick={ev => {
                                        submit(ev);
                                    }}
                                >
                                    + {t`Create Page Template`}
                                </ButtonPrimary>
                            </UID.DialogActions>
                        </>
                    )}
                </Form>
            )}
        </UID.Dialog>
    );
};

export default NewContentModelDialog;
