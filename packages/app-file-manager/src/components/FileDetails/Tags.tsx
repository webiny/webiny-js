import React, { useCallback, useState } from "react";
import classNames from "classnames";
import { css } from "emotion";
import { Chips, Chip } from "@webiny/ui/Chips";
import { ButtonSecondary, ButtonPrimary, ButtonDefault, IconButton } from "@webiny/ui/Button";
import { MultiAutoComplete } from "@webiny/ui/AutoComplete";
import { Icon } from "@webiny/ui/Icon";
import { Form, FormOnSubmit } from "@webiny/form";
import { ReactComponent as EditIcon } from "@material-design-icons/svg/outlined/edit.svg";
import { ReactComponent as LabelIcon } from "@material-design-icons/svg/outlined/label.svg";
import { useSnackbar } from "@webiny/app-admin";
import { useFile, useFileManagerApi, useFileManagerView } from "~/index";
import { useTags } from "@webiny/app-aco";
import { ACO_TYPE, DEFAULT_SCOPE } from "~/constants";

const chipsStyle = css({
    "&.mdc-chip-set": {
        padding: 0,
        marginLeft: -4,
        "& .mdc-chip": {
            backgroundColor: "var(--mdc-theme-background)"
        }
    }
});
const iconButtonStyle = css({
    "&.mdc-icon-button svg": {
        width: 20,
        height: 20
    }
});
const addTagsStyle = css({
    "&.mdc-button:not(:disabled)": {
        color: "var(--mdc-theme-text-secondary-on-background)",
        textTransform: "capitalize",
        letterSpacing: "initial",
        marginLeft: -8
    }
});
const actionWrapperStyle = css({
    marginTop: 16,
    "& button:first-child": {
        marginRight: 16
    }
});

interface TagsFormData {
    tags: string[];
}

export const getInitialWhere = (scope: string | undefined) => {
    let scopeFilter = {};

    if (!scope) {
        scopeFilter = {
            tags_not_startsWith: DEFAULT_SCOPE
        };
    } else {
        scopeFilter = {
            tags_startsWith: scope
        };
    }

    return {
        AND: [{ tags_not_startsWith: "mime:" }, scopeFilter]
    };
};
const Tags = () => {
    const { file } = useFile();
    const { tags } = useTags({ type: ACO_TYPE, ...getInitialWhere });
    const [editing, setEdit] = useState(false);
    const [updating, setUpdating] = useState(false);
    const { showSnackbar } = useSnackbar();
    const { canEdit } = useFileManagerApi();
    const { updateFile } = useFileManagerView();
    const [initialTags, setInitialTags] = useState(file.tags);
    const handleEdit = useCallback(() => setEdit(true), []);
    const isEditingAllowed = canEdit(file);

    const renderHeaderContent = useCallback(
        ({ data }: { data: TagsFormData }) => {
            if (editing) {
                return null;
            }
            const hasTags = data.tags.length > 0;

            if (hasTags) {
                // Render existing tags and "edit tags" action.
                return (
                    <>
                        <Chips className={classNames("list-item__content", chipsStyle)}>
                            {data.tags.map(tag => {
                                return <Chip key={tag} label={tag} />;
                            })}
                        </Chips>
                        {isEditingAllowed && (
                            <IconButton
                                className={iconButtonStyle}
                                icon={<EditIcon />}
                                onClick={handleEdit}
                            />
                        )}
                    </>
                );
            }
            // Render "add tags" action.
            return (
                <ButtonDefault
                    className={addTagsStyle}
                    onClick={handleEdit}
                    disabled={!isEditingAllowed}
                    data-testid="fm.tags.add"
                >
                    Add tags...
                </ButtonDefault>
            );
        },
        [editing, isEditingAllowed]
    );

    const onSubmit: FormOnSubmit<TagsFormData> = async ({ tags }) => {
        setUpdating(true);
        await updateFile(file.id, { tags });
        setUpdating(false);
        setInitialTags(tags);
        setEdit(false);
        showSnackbar("Tags successfully updated.");
    };

    return (
        <Form<TagsFormData> data={{ tags: initialTags }} onSubmit={onSubmit}>
            {({ Bind, data, setValue, submit }) => (
                <React.Fragment>
                    <li-title>
                        <Icon className={"list-item__icon"} icon={<LabelIcon />} />
                        {renderHeaderContent({ data })}
                    </li-title>
                    {editing && (
                        <li-content>
                            <Bind name={"tags"}>
                                <MultiAutoComplete
                                    options={tags.map(tag => tag.name)}
                                    placeholder={"homepage asset"}
                                    description={"Type in a new tag or select an existing one."}
                                    unique={true}
                                    allowFreeInput={true}
                                    useSimpleValues={true}
                                    disabled={updating}
                                />
                            </Bind>
                            <div className={actionWrapperStyle}>
                                <ButtonPrimary
                                    small
                                    onClick={submit}
                                    data-testid={"fm.tags.submit"}
                                >
                                    Submit
                                </ButtonPrimary>
                                <ButtonSecondary
                                    small
                                    onClick={() => {
                                        setValue("tags", initialTags);
                                        setEdit(false);
                                    }}
                                >
                                    Cancel
                                </ButtonSecondary>
                            </div>
                        </li-content>
                    )}
                </React.Fragment>
            )}
        </Form>
    );
};

export default Tags;
