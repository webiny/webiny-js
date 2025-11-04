import React, { Fragment, useMemo } from "react";
import { validation } from "@webiny/validation";
import { Bind } from "@webiny/form";
import {
    Button,
    cn,
    DynamicFieldset,
    Grid,
    IconButton,
    Input,
    Label,
    Text
} from "@webiny/admin-ui";
import { ReactComponent as DeleteIcon } from "@webiny/icons/delete.svg";
import { ReactComponent as AddIcon } from "@webiny/icons/add.svg";

const Header = ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
    return (
        <div className={cn("flex justify-between", className)} {...props}>
            {children}
        </div>
    );
};

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
                        <div className={"mt-md"}>
                            <Text size={"sm"} as={"div"} className={"mb-sm"}>
                                {"Enter a fully qualified domain name to use for this tenant."}
                            </Text>
                            <div className={"flex items-start gap-sm"}>
                                <Bind
                                    validators={fqdnValidator}
                                    name={`settings.domains.${index}.fqdn`}
                                >
                                    <Input size={"lg"} placeholder={props.inputLabel} />
                                </Bind>
                                <IconButton
                                    variant={"ghost"}
                                    size={"lg"}
                                    icon={<DeleteIcon />}
                                    onClick={actions.remove(index)}
                                />
                            </div>
                        </div>
                    ))}
                    {empty(() => (
                        <>
                            <Header>
                                <Label text={props.title} />
                                <Button
                                    onClick={addDomain}
                                    text={props.addButtonLabel}
                                    icon={<AddIcon />}
                                    variant={"secondary"}
                                    size={"sm"}
                                />
                            </Header>
                            <Text size={"sm"} as={"div"} className={"mt-sm"}>
                                To make your tenant accessible via custom domains, you must define
                                them here. Webiny will use these entries to route the incoming
                                requests.
                            </Text>
                        </>
                    ))}
                    {header(() => (
                        <Header>
                            <Label text={props.title} />
                            <Button
                                onClick={addDomain}
                                text={props.addButtonLabel}
                                icon={<AddIcon />}
                                variant={"secondary"}
                                size={"sm"}
                            />
                        </Header>
                    ))}
                </>
            )}
        </DynamicFieldset>
    );
};

export const Domains = () => {
    return (
        <Grid.Column span={12}>
            <Bind name={"settings.domains"} defaultValue={[]}>
                <DomainsFieldset
                    title={"Custom Domains"}
                    inputLabel={"FQDN"}
                    addButtonLabel={"Add FQDN"}
                />
            </Bind>
        </Grid.Column>
    );
};
