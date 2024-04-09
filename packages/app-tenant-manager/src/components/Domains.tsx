import React, { Fragment, useMemo } from "react";
import { DynamicFieldset } from "@webiny/ui/DynamicFieldset";
import { Input } from "@webiny/ui/Input";
import styled from "@emotion/styled";
import { Typography } from "@webiny/ui/Typography";
import { ButtonSecondary, ButtonDefault } from "@webiny/ui/Button";
import { validation } from "@webiny/validation";
import { Bind } from "@webiny/form";
import { Cell, Grid } from "@webiny/ui/Grid";

const Fieldset = styled("div")({
    position: "relative",
    width: "100%",
    marginBottom: 15,
    ".webiny-ui-button": {
        position: "absolute",
        display: "block",
        right: 10,
        top: 13
    }
});

const Header = styled("div")({
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 15
});

interface Domain {
    fqdn: string;
}

interface DomainsProps {
    value?: Domain[];
    onChange?: (value: any) => void;
    title: string;
    inputLabel: string;
    addButtonLabel: string;
}

const FQDN_REGEX = /(?=^.{4,253}$)(^((?!-)[a-zA-Z0-9-]{0,62}[a-zA-Z0-9]\.)+[a-zA-Z]{2,63}$)/;

export const DomainsFieldset = (props: DomainsProps) => {
    const { onChange, value } = props;

    const addDomain = () => {
        const newValue = Array.isArray(value) ? [...value] : [];
        newValue.push({ fqdn: "" });
        if (!onChange) {
            return;
        }
        onChange(newValue);
    };

    const fqdnValidator = useMemo(() => {
        return [
            validation.create("required"),
            (value: string) => {
                if (!FQDN_REGEX.test(value)) {
                    throw new Error("Value must be a valid FQDN.");
                }
            }
        ];
    }, []);

    return (
        <DynamicFieldset value={value} onChange={onChange}>
            {({ actions, header, row, empty }) => (
                <>
                    {row(({ index }) => (
                        <Fieldset>
                            <Bind
                                validators={fqdnValidator}
                                name={`settings.domains.${index}.fqdn`}
                            >
                                <Input
                                    label={props.inputLabel}
                                    description={
                                        "Enter a fully qualified domain name to use for this tenant."
                                    }
                                />
                            </Bind>
                            <ButtonSecondary small onClick={actions.remove(index)}>
                                Remove
                            </ButtonSecondary>
                        </Fieldset>
                    ))}
                    {empty(() => (
                        <Fragment>
                            <Header>
                                <Typography use={"overline"}>{props.title}</Typography>
                                <ButtonDefault onClick={addDomain}>
                                    {props.addButtonLabel}
                                </ButtonDefault>
                            </Header>
                            <Typography use={"body1"}>
                                To make your tenant accessible via custom domains, you must define
                                them here. Webiny will use these entries to route the incoming
                                requests.
                            </Typography>
                        </Fragment>
                    ))}
                    {header(() => (
                        <Header>
                            <Typography use={"overline"}>{props.title}</Typography>
                            <ButtonDefault onClick={addDomain}>
                                {props.addButtonLabel}
                            </ButtonDefault>
                        </Header>
                    ))}
                </>
            )}
        </DynamicFieldset>
    );
};

export const Domains = () => {
    return (
        <Grid>
            <Cell span={12}>
                <Bind name={"settings.domains"} defaultValue={[]}>
                    <DomainsFieldset
                        title={"Custom Domains"}
                        inputLabel={"FQDN"}
                        addButtonLabel={"+ Add FQDN"}
                    />
                </Bind>
            </Cell>
        </Grid>
    );
};
