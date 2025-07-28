import React from "react";
import { ReactComponent as AddIcon } from "@webiny/icons/add.svg";
import { ReactComponent as DeleteIcon } from "@webiny/icons/delete.svg";
import { Bind, useBind } from "@webiny/form";
import {
    Button,
    DynamicFieldset,
    FormComponentDescription,
    FormComponentLabel,
    IconButton,
    Input
} from "@webiny/admin-ui";

interface HeaderProps {
    label: string;
    description: string;
}

const Header = ({ label, description }: HeaderProps) => {
    return (
        <>
            <FormComponentLabel text={label} />
            <FormComponentDescription text={description} />
        </>
    );
};

interface FooterProps {
    onClick: () => void;
}

const Footer = ({ onClick }: FooterProps) => {
    return (
        <div className={"wby-mt-md"}>
            <Button
                onClick={onClick}
                text="Add tag"
                variant={"secondary"}
                size={"sm"}
                icon={<AddIcon />}
            />
        </div>
    );
};

export interface MetaTagsProps {
    label: string;
    description: string;
    bindName: string;
    keyName: string;
    keyLabel: string;
    valueName: string;
    valueLabel: string;
}

export const MetaTags = (props: MetaTagsProps) => {
    const { value, onChange } = useBind({ name: props.bindName, defaultValue: [] });

    return (
        <DynamicFieldset value={value} onChange={onChange}>
            {({ actions, header, footer, row, empty }) => (
                <>
                    {row(({ index }) => (
                        <div className={"wby-mt-md"}>
                            <div className={"wby-flex wby-items-start wby-gap-sm"}>
                                <Bind name={`${props.bindName}.${index}.${props.keyName}`}>
                                    <Input placeholder={props.keyLabel} size={"lg"} />
                                </Bind>
                                <Bind name={`${props.bindName}.${index}.${props.valueName}`}>
                                    <Input placeholder={props.valueLabel} size={"lg"} />
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
                    {footer(() => (
                        <Footer onClick={actions.add()} />
                    ))}
                    {header(() => (
                        <Header label={props.label} description={props.description} />
                    ))}
                    {empty(() => (
                        <>
                            <Header label={props.label} description={props.description} />
                            <Footer onClick={actions.add()} />
                        </>
                    ))}
                </>
            )}
        </DynamicFieldset>
    );
};
