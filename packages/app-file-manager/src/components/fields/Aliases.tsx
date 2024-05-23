import React, { Fragment, useMemo } from "react";
import styled from "@emotion/styled";
import { ReactComponent as DeleteIcon } from "@material-design-icons/svg/outlined/delete.svg";
import { DynamicFieldset } from "@webiny/ui/DynamicFieldset";
import { Input } from "@webiny/ui/Input";
import { Typography } from "@webiny/ui/Typography";
import { ButtonDefault, IconButton } from "@webiny/ui/Button";
import { validation } from "@webiny/validation";
import { Bind, useBind } from "@webiny/form";

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
    justifyContent: "space-between"
});

const DeleteAliasButton = styled(IconButton)`
    position: absolute;
    top: 5px;
    right: 5px;
`;

const FileAliasMessage = styled("span")`
    color: var(--mdc-theme-text-secondary-on-background);
    font-size: 12px;
`;

const PATHNAME_REGEX = /^\/[/.a-zA-Z0-9-_]+$/;

export const Aliases = () => {
    const { value, onChange } = useBind<string[]>({ name: "aliases" });

    const addAlias = () => {
        const newValue = Array.isArray(value) ? [...value] : [];
        newValue.push("");
        if (!onChange) {
            return;
        }
        onChange(newValue);
    };

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
        <DynamicFieldset value={value || [""]} onChange={onChange}>
            {({ actions, header, row, empty }) => (
                <>
                    {row(({ index }) => (
                        <Fieldset>
                            <Bind validators={aliasValidator} name={`aliases.${index}`}>
                                <Input
                                    placeholder={"Alias"}
                                    description={
                                        "Enter a file path, e.g., /my/custom/file/path.png"
                                    }
                                />
                            </Bind>
                            <DeleteAliasButton
                                icon={<DeleteIcon />}
                                onClick={actions.remove(index)}
                            />
                        </Fieldset>
                    ))}
                    {empty(() => (
                        <Fragment>
                            <Header>
                                <Typography use={"overline"}>File Aliases</Typography>
                                <ButtonDefault onClick={addAlias}>+ Add Alias</ButtonDefault>
                            </Header>
                            <Typography use={"caption"}>
                                <FileAliasMessage>
                                    To make your file accessible via custom paths, add one or more
                                    aliases.
                                </FileAliasMessage>
                            </Typography>
                        </Fragment>
                    ))}
                    {header(() => (
                        <Header>
                            <Typography use={"overline"}>File Aliases</Typography>
                            <ButtonDefault onClick={addAlias}>+ Add Alias</ButtonDefault>
                        </Header>
                    ))}
                </>
            )}
        </DynamicFieldset>
    );
};
