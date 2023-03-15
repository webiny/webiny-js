import React, { Fragment, useMemo, useState } from "react";
import { DynamicFieldset } from "@webiny/ui/DynamicFieldset";
import { Input } from "@webiny/ui/Input";
import styled from "@emotion/styled";
import { Typography } from "@webiny/ui/Typography";
import { ButtonSecondary, ButtonDefault, IconButton, ButtonPrimary } from "@webiny/ui/Button";
import { validation } from "@webiny/validation";
import { Form, Bind, FormOnSubmit, useBind } from "@webiny/form";
import { Icon } from "@webiny/ui/Icon";
import { ReactComponent as LinkIcon } from "@material-design-icons/svg/filled/link.svg";
import { ReactComponent as EditIcon } from "@material-design-icons/svg/filled/edit.svg";
import { ReactComponent as DeleteIcon } from "@material-design-icons/svg/filled/delete.svg";
import { useFile } from "~/components/FileManager/FileDetails/FileProvider";
import { useFileManager } from "~/components/FileManager/FileManagerContext";
import { useSnackbar } from "~/hooks/useSnackbar";

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

const DeleteAliasButton = styled(IconButton)`
    position: absolute;
    top: 5px;
    right: 5px;
`;

const AliasList = styled.ul`
    padding-left: 48px;
    li {
        padding: 0;
    }
`;

const PATHNAME_REGEX = /^\/[/.a-zA-Z0-9-]+$/;

export const AliasEditor = () => {
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
                            <Typography use={"body2"}>
                                To make your file accessible via custom paths, add one or more
                                aliases.
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

const EditButton = styled(IconButton)`
    &.mdc-icon-button svg {
        width: 20px;
        height: 20px;
    }
`;

const EmptyAddAlias = styled(ButtonDefault)`
    &.mdc-button:not(:disabled) {
        color: var(--mdc-theme-text-secondary-on-background);
        text-transform: capitalize;
        letter-spacing: initial;
        margin-left: -8px;
    }
`;

const ButtonsWrapper = styled.div`
    margin-top: 16px;
    & button:first-of-type {
        margin-right: 16px;
    }
`;

interface AliasesFormData {
    aliases: string[];
}

export const Aliases = () => {
    const { updateFile, canEdit } = useFileManager();
    const { file } = useFile();
    const [isEditing, setIsEditing] = useState(false);
    const { showSnackbar } = useSnackbar();
    const [updating, setUpdating] = useState(false);
    const isEditingAllowed = canEdit(file);

    const getUrlWithAlias = (alias: string) => {
        const url = new URL(file.src);
        url.pathname = alias;
        return url.toString();
    };

    const onEdit = () => setIsEditing(true);
    const cancelEdit = () => setIsEditing(false);

    const onSubmit: FormOnSubmit<AliasesFormData> = async ({ aliases }) => {
        setUpdating(true);
        await updateFile(file.id, { aliases });
        setUpdating(false);
        setIsEditing(false);
        showSnackbar("Aliases successfully updated.");
    };

    const aliases = file.aliases || [];

    return (
        <Form<AliasesFormData>
            // An empty string immediately creates an input, for better UX.
            data={{ aliases: aliases.length ? aliases : [""] }}
            onSubmit={onSubmit}
        >
            {({ submit }) => (
                <>
                    <li-title>
                        <Icon className={"list-item__icon"} icon={<LinkIcon />} />
                        {aliases.length && !isEditing ? (
                            <Typography use={"subtitle1"} className={"list-item__content"}>
                                File aliases
                            </Typography>
                        ) : null}
                        {!aliases.length && !isEditing ? (
                            <EmptyAddAlias
                                onClick={onEdit}
                                disabled={!isEditingAllowed}
                                data-testid="fm.alias.add"
                            >
                                Add aliases...
                            </EmptyAddAlias>
                        ) : null}

                        {isEditingAllowed && aliases.length && !isEditing ? (
                            <EditButton icon={<EditIcon />} onClick={onEdit} />
                        ) : null}
                    </li-title>
                    {isEditing ? (
                        <>
                            <AliasEditor />
                            <ButtonsWrapper>
                                <ButtonPrimary
                                    small
                                    onClick={submit}
                                    disabled={updating}
                                    data-testid={"fm.aliases.submit"}
                                >
                                    {updating ? "Saving..." : "Save changes"}
                                </ButtonPrimary>
                                <ButtonSecondary small onClick={cancelEdit}>
                                    Cancel
                                </ButtonSecondary>
                            </ButtonsWrapper>
                        </>
                    ) : (
                        <AliasList>
                            {aliases.map(alias => (
                                <li key={alias}>
                                    <Typography use={"subtitle1"} className={"list-item__content"}>
                                        -{" "}
                                        <a
                                            rel="noreferrer"
                                            href={getUrlWithAlias(alias)}
                                            target={"_blank"}
                                        >
                                            {alias}
                                        </a>
                                    </Typography>
                                </li>
                            ))}
                        </AliasList>
                    )}
                </>
            )}
        </Form>
    );
};
