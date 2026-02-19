import React, { Fragment, useMemo } from "react";
import { CheckboxGroup, Grid, Select } from "@webiny/admin-ui";
import { Form } from "@webiny/form";
import type { BindComponent } from "@webiny/form";
import {
    CannotUseAaclAlert,
    PermissionInfo,
    PermissionsGroup
} from "../components/Permissions/index.js";
import { usePermissionForm } from "./usePermissionForm.js";
import type { AaclPermission } from "../features/wcp/types.js";
import type { PermissionSchema, EntityDefinition } from "./types.js";
import { usePermissionValue } from "./PermissionValueContext.js";
import { useAuthentication } from "~/exports/admin/security.js";

export interface PermissionRendererProps {
    schema: PermissionSchema;
}

const NO_ACCESS = "no";
const FULL_ACCESS = "full";
const CUSTOM_ACCESS = "custom";

const RWD_OPTIONS = [
    { value: "r", label: "Read" },
    { value: "rw", label: "Read, write" },
    { value: "rwd", label: "Read, write, delete" }
];

const PW_OPTIONS = [
    { value: "p", label: "Publish" },
    { value: "u", label: "Unpublish" }
];

function buildScopeOptions(entity: EntityDefinition) {
    const options = [{ value: NO_ACCESS, label: "No access" }];

    if (entity.scopes.includes("full")) {
        options.push({ value: FULL_ACCESS, label: "Full access" });
    }

    if (entity.scopes.includes("own")) {
        options.push({ value: "own", label: "Only entries created by the user" });
    }

    return options;
}

interface EntitySectionProps {
    entity: EntityDefinition;
    data: Record<string, any>;
    cannotUseAAcl: boolean;
    Bind: BindComponent;
    setValue: (name: string, value: any) => void;
}

function EntitySection({ entity, data, cannotUseAAcl, Bind, setValue }: EntitySectionProps) {
    const scopeField = `${entity.id}AccessScope`;
    const rwdField = `${entity.id}RWD`;
    const pwField = `${entity.id}PW`;
    const currentScope = data[scopeField];

    return (
        <PermissionsGroup title={entity.title || entity.id}>
            <Grid>
                <Grid.Column span={12}>
                    <Bind
                        name={scopeField}
                        beforeChange={(value: string, cb: (v: string) => void) => {
                            if (value === "own" && entity.actions?.rwd) {
                                setValue(rwdField, "rwd");
                            }
                            cb(value);
                        }}
                    >
                        <Select
                            label={"Access Scope"}
                            disabled={cannotUseAAcl}
                            options={buildScopeOptions(entity)}
                        />
                    </Bind>
                </Grid.Column>
            </Grid>
            {entity.actions?.rwd && (
                <Grid>
                    <Grid.Column span={12}>
                        <Bind name={rwdField}>
                            <Select
                                label={"Primary Actions"}
                                disabled={
                                    cannotUseAAcl ||
                                    currentScope === "own" ||
                                    !currentScope ||
                                    currentScope === NO_ACCESS
                                }
                                options={RWD_OPTIONS}
                            />
                        </Bind>
                    </Grid.Column>
                </Grid>
            )}
            {entity.actions?.pw && (
                <Grid>
                    <Grid.Column span={12}>
                        <Bind name={pwField}>
                            <CheckboxGroup
                                label={"Publishing actions"}
                                description={
                                    "Publishing-related actions that can be performed on entries."
                                }
                                items={PW_OPTIONS.map(opt => ({
                                    ...opt,
                                    disabled:
                                        cannotUseAAcl || !currentScope || currentScope === NO_ACCESS
                                }))}
                            />
                        </Bind>
                    </Grid.Column>
                </Grid>
            )}
        </PermissionsGroup>
    );
}

export const PermissionRenderer = ({ schema }: PermissionRendererProps) => {
    const { value, onChange } = usePermissionValue();
    const { identity } = useAuthentication();

    const cannotUseAAcl = useMemo(() => {
        return !identity.getPermission<AaclPermission>("aacl", true);
    }, []);

    const { formData, onFormChange } = usePermissionForm(schema, { value, onChange });

    const hasEntities = schema.entities.length > 0;

    const accessLevelOptions = hasEntities
        ? [
              { value: NO_ACCESS, label: "No access" },
              { value: FULL_ACCESS, label: "Full access" },
              { value: CUSTOM_ACCESS, label: "Custom access" }
          ]
        : [
              { value: NO_ACCESS, label: "No access" },
              { value: FULL_ACCESS, label: "Full access" }
          ];

    return (
        <Form data={formData} onChange={onFormChange}>
            {({ data, Bind, setValue }) => (
                <Fragment>
                    <Grid className={"pt-md"}>
                        <Grid.Column span={12}>
                            {data.accessLevel === CUSTOM_ACCESS && cannotUseAAcl && (
                                <CannotUseAaclAlert />
                            )}
                        </Grid.Column>
                    </Grid>
                    <Grid className={"pt-md"}>
                        <Grid.Column span={6}>
                            <PermissionInfo title={"Access Level"} />
                        </Grid.Column>
                        <Grid.Column span={6}>
                            <Bind name={"accessLevel"}>
                                <Select options={accessLevelOptions} />
                            </Bind>
                        </Grid.Column>
                    </Grid>
                    {data.accessLevel === CUSTOM_ACCESS && hasEntities && (
                        <div className={"mt-lg"}>
                            {schema.entities.map(entity => (
                                <EntitySection
                                    key={entity.id}
                                    entity={entity}
                                    data={data}
                                    cannotUseAAcl={cannotUseAAcl}
                                    Bind={Bind}
                                    setValue={setValue}
                                />
                            ))}
                        </div>
                    )}
                </Fragment>
            )}
        </Form>
    );
};
