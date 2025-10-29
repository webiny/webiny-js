import React, { useMemo } from "react";
import { ReactComponent as AddIcon } from "@webiny/icons/add.svg";
import { ReactComponent as DeleteIcon } from "@webiny/icons/delete.svg";
import { validation } from "@webiny/validation";
import { Bind, useBind } from "@webiny/form";
import { Button, DynamicFieldset, Heading, IconButton, Input, Text } from "@webiny/admin-ui";

const PATHNAME_REGEX = /^\/[/.a-zA-Z0-9-_]+$/;

const Header = () => {
    return (
        <>
            <Heading level={6} className={"text-neutral-primary"}>
                {"File Aliases"}
            </Heading>
            <Text size={"sm"} as={"div"} className={"mt-xs"}>
                To make your file accessible via custom paths, add one or more aliases.
            </Text>
        </>
    );
};

interface FooterProps {
    addAlias: () => void;
}

const Footer = ({ addAlias }: FooterProps) => {
    return (
        <div className={"mt-md"}>
            <Button
                onClick={addAlias}
                text="Add Alias"
                variant={"secondary"}
                size={"sm"}
                icon={<AddIcon />}
            />
        </div>
    );
};

export const Aliases = () => {
    const { value, onChange } = useBind({ name: "aliases" });

    const aliasValidator = useMemo(() => {
        return [
            validation.create("required"),
            (value: string) => {
                if (!PATHNAME_REGEX.test(value)) {
                    throw new Error("Value must be a valid pathname.");
                }
            }
        ];
    }, []);

    return (
        <div className={"my-lg"}>
            <DynamicFieldset value={value || [""]} onChange={onChange} onAdd={() => ""}>
                {({ actions, header, footer, row, empty }) => (
                    <>
                        {row(({ index }) => (
                            <div className={"mt-md"}>
                                <Text size={"sm"} as={"div"} className={"mb-sm"}>
                                    {"Enter a file path, e.g., /my/custom/file/path.png"}
                                </Text>
                                <div className={"flex items-start gap-sm"}>
                                    <Bind validators={aliasValidator} name={`aliases.${index}`}>
                                        <Input placeholder={"Alias"} size={"lg"} />
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
                            <Footer addAlias={actions.add()} />
                        ))}
                        {header(() => (
                            <Header />
                        ))}
                        {empty(() => (
                            <>
                                <Header />
                                <Footer addAlias={actions.add()} />
                            </>
                        ))}
                    </>
                )}
            </DynamicFieldset>
        </div>
    );
};
