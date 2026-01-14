import React, { useEffect, useMemo } from "react";
import get from "lodash/get.js";
import { i18n } from "@webiny/app/i18n/index.js";
import type { CmsDataCmsGroup, CmsDataCmsModel } from "./useCmsData.js";
import { useCmsData } from "./useCmsData.js";
import ContentModelList from "./ContentModelList.js";
import type { BindComponent } from "@webiny/form/types.js";
import type { CmsSecurityPermission } from "~/types.js";
import { FormComponentNote, Grid, Select } from "@webiny/admin-ui";
import { PermissionsGroup } from "@webiny/app-admin";

const t = i18n.ns("app-headless-cms/admin/plugins/permissionRenderer");

interface ContentModelPermissionProps {
    Bind: BindComponent;
    data: CmsSecurityPermission;
    setValue: (name: string, value: string) => void;
    entity: string;
    title: string;
    selectedContentModelGroups?: string[];
    disabled?: boolean;
}
export const ContentModelPermission = ({
    Bind,
    data,
    setValue,
    entity,
    title,
    selectedContentModelGroups = [],
    disabled
}: ContentModelPermissionProps) => {
    const modelsGroups = useCmsData();
    // Set "cms.contentModel" access scope to "own" if "cms.contentModelGroup" === "own".
    useEffect(() => {
        if (
            get(data, `contentModelGroupAccessScope`) === "own" &&
            get(data, `${entity}AccessScope`) !== "own"
        ) {
            setValue(`${entity}AccessScope`, "own");
        }
    }, [data]);

    const items = useMemo((): CmsDataCmsModel<CmsDataCmsGroup>[] => {
        let list = modelsGroups.models;

        const groups: string[] = selectedContentModelGroups || [];
        if (groups.length) {
            // Filter by groups
            list = list.filter(item => groups.includes(item.group.slug));
        }

        return list;
    }, [modelsGroups]);

    const endpoints = data.endpoints || [];

    const disabledPrimaryActions =
        [undefined, "own", "no"].includes(data[`${entity}AccessScope`]) ||
        !endpoints.includes("manage");

    return (
        <PermissionsGroup title={title}>
            <Grid>
                <Grid.Column span={12}>
                    <Grid>
                        <Grid.Column span={12}>
                            <Bind name={`${entity}AccessScope`} defaultValue={"full"}>
                                <Select
                                    label={t`Access Scope`}
                                    disabled={
                                        disabled || data[`contentModelGroupAccessScope`] === "own"
                                    }
                                    description={t`The list of available models is defined by the options set in the content model groups section above.`}
                                    options={[
                                        {
                                            value: "full",
                                            label: t`All models`
                                        },
                                        {
                                            value: "models",
                                            label: t`Only specific models`
                                        },
                                        ...((endpoints.includes("manage") && [
                                            {
                                                value: "own",
                                                label: t`Only models created by the user`
                                            }
                                        ]) ||
                                            [])
                                    ]}
                                />
                            </Bind>
                            {data[`contentModelGroupAccessScope`] === "own" && (
                                <FormComponentNote>
                                    <strong>Content Model</strong>
                                    &nbsp;{t`access depends upon`}&nbsp;
                                    <strong>Content Model Group</strong>
                                </FormComponentNote>
                            )}
                        </Grid.Column>
                        <>
                            {data[`${entity}AccessScope`] === "models" && (
                                <Grid.Column span={12}>
                                    <FormComponentNote
                                        text={`Select the model user will be allowed to access.`}
                                    />
                                    {items.length === 0 ? (
                                        <Bind name={`${entity}Props.models`}>
                                            <></>
                                        </Bind>
                                    ) : (
                                        <div className={"mt-md"}>
                                            <Bind name={`${entity}Props.models`}>
                                                <ContentModelList items={items} />
                                            </Bind>
                                        </div>
                                    )}
                                </Grid.Column>
                            )}
                        </>

                        <Grid.Column span={12}>
                            <Bind name={`${entity}RWD`}>
                                <Select
                                    label={t`Primary Actions`}
                                    placeholder={"Read-only"}
                                    disabled={disabled || disabledPrimaryActions}
                                    options={[
                                        {
                                            value: "r",
                                            label: t`Read-only`
                                        },
                                        ...(endpoints.includes("manage")
                                            ? [
                                                  {
                                                      value: "rw",
                                                      label: t`Read, write`
                                                  },
                                                  {
                                                      value: "rwd",
                                                      label: t`Read, write, delete`
                                                  }
                                              ]
                                            : [])
                                    ]}
                                />
                            </Bind>
                        </Grid.Column>
                    </Grid>
                </Grid.Column>
            </Grid>
        </PermissionsGroup>
    );
};
