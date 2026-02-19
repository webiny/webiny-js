import React, { Fragment, useCallback, useMemo } from "react";
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
import type { ActionDefinition, PermissionSchema, EntityDefinition } from "./types.js";
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

function hasAction(entity: EntityDefinition, name: string): boolean {
    return entity.actions?.some(a => a.name === name) ?? false;
}

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

const BUILTIN_ACTIONS = new Set(["rwd", "pw"]);

function getCustomActions(entity: EntityDefinition): ActionDefinition[] {
    return (entity.actions ?? []).filter(a => !BUILTIN_ACTIONS.has(a.name));
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
    const currentScope = data[scopeField];
    const scopeDisabled = cannotUseAAcl || !currentScope || currentScope === NO_ACCESS;
    const customActions = useMemo(() => getCustomActions(entity), [entity]);

    // Derive the selected values array from individual boolean form fields.
    const customActionsValue = useMemo(() => {
        return customActions.filter(a => data[`${entity.id}Action_${a.name}`]).map(a => a.name);
    }, [data, customActions, entity.id]);

    const onCustomActionsChange = useCallback(
        (selected: string[]) => {
            const selectedSet = new Set(selected);
            for (const action of customActions) {
                setValue(`${entity.id}Action_${action.name}`, selectedSet.has(action.name));
            }
        },
        [customActions, entity.id, setValue]
    );

    const columns = [
        <Grid.Column span={12} key={"access"}>
            <Bind
                name={scopeField}
                beforeChange={(value: string, cb: (v: string) => void) => {
                    if (value === "own" && hasAction(entity, "rwd")) {
                        setValue(`${entity.id}RWD`, "rwd");
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
    ];

    if (hasAction(entity, "rwd")) {
        columns.push(
            <Grid.Column span={12} key={"pw"}>
                <Bind name={`${entity.id}RWD`}>
                    <Select
                        label={"Primary Actions"}
                        disabled={scopeDisabled || currentScope === "own"}
                        options={RWD_OPTIONS}
                    />
                </Bind>
            </Grid.Column>
        );
    }

    if (hasAction(entity, "pw")) {
        columns.push(
            <Grid.Column span={12} key={"pw"}>
                <Bind name={`${entity.id}PW`}>
                    <CheckboxGroup
                        label={"Publishing actions"}
                        description={"Publishing-related actions that can be performed on entries."}
                        items={PW_OPTIONS.map(opt => ({
                            ...opt,
                            disabled: scopeDisabled
                        }))}
                    />
                </Bind>
            </Grid.Column>
        );
    }

    if (customActions.length > 0) {
        columns.push(
            <Grid.Column span={12} key={"other"}>
                <CheckboxGroup
                    label={"Other Actions"}
                    value={customActionsValue}
                    onChange={onCustomActionsChange}
                    items={customActions.map(action => ({
                        value: action.name,
                        label: action.label || action.name,
                        disabled: scopeDisabled
                    }))}
                />
            </Grid.Column>
        );
    }

    return (
        <PermissionsGroup title={entity.title || entity.id}>
            <Grid>{columns}</Grid>
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

    const entities = schema.entities || [];
    const hasEntities = entities.length > 0;

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
                            {entities.map(entity => (
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
