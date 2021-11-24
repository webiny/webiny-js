import React, { useCallback, useState } from "react";
import { Grid, Cell } from "@webiny/ui/Grid";
import { Input } from "@webiny/ui/Input";
import { Select } from "@webiny/ui/Select";
import { plugins } from "@webiny/plugins";
import { validation } from "@webiny/validation";
import { CmsEditorFieldValidatorPlugin } from "~/types";
import { CmsEditorFieldValidatorFileTypePlugin } from "~/admin/plugins/definitions/CmsEditorFieldValidatorFileTypePlugin";
import { AutoComplete } from "@webiny/ui/AutoComplete";
import debounce from "lodash/debounce";
import { useQuery } from "@apollo/react-hooks";
import { LIST_FILES } from "@webiny/app-admin/components/FileManager/graphql";
import dotProp from "dot-prop-immutable";

const fileTypes = {
    images: [],
    documents: [],
    all: null
};

interface TagsAutocompleteProps {
    types?: string[];
    tags: string[];
}
const TagsAutocomplete: React.FunctionComponent<TagsAutocompleteProps> = props => {
    const { types, tags } = props;
    const [search, setSearch] = useState<string>(null);

    const queryParams = {
        where: {
            type_in: types,
            tag_not_in: tags
        },
        limit: 10
    };

    const gqlQuery = useQuery(LIST_FILES, {
        variables: queryParams,
        skip: !search
    });

    const onInput = useCallback(
        debounce(search => setSearch(search), 250),
        []
    );

    const { data, loading } = gqlQuery;

    const options = dotProp.get(data, "fileManager.listFiles.data", []);

    return (
        <AutoComplete
            loading={loading}
            value={null}
            options={options}
            label={"Tag search"}
            onInput={onInput}
            description={"Search tags with which you wish to limit the files"}
            useSimpleValues={true}
        />
    );
};

const defaultMessage = "Invalid file type.";

export default (): CmsEditorFieldValidatorPlugin => {
    return {
        type: "cms-editor-field-validator",
        name: "cms-editor-field-validator-fileType",
        validator: {
            name: "fileType",
            label: "File type",
            description: "You can only select file of a defined type.",
            defaultMessage,
            defaultSettings: {
                fileType: "all",
                minWidth: null,
                maxWidth: null,
                minHeight: null,
                maxHeight: null,
                tags: []
            },
            renderSettings({ Bind, setValue, setMessage, data }) {
                const tags = data.settings && data.settings.tags ? data.settings.tags : [];
                const fileType = data.settings.fileType;

                const imagesCellStyle = fileType === "images" ? {} : { display: "none" };

                const fileTypePlugins = plugins.byType<CmsEditorFieldValidatorFileTypePlugin>(
                    CmsEditorFieldValidatorFileTypePlugin.type
                );

                const selectOptions: any = fileTypePlugins.map(item => (
                    <option key={item.getName()} value={item.getName()}>
                        {item.getLabel()}
                    </option>
                ));

                return (
                    <>
                        <Grid>
                            <Cell span={2}>
                                <Bind
                                    name={"settings.fileType"}
                                    validators={validation.create("required")}
                                    afterChange={value => {
                                        if (value === "all") {
                                            setMessage(defaultMessage);
                                            return;
                                        }
                                        setValue("settings.minWidth", null);
                                        setValue("settings.maxWidth", null);
                                        setValue("settings.minHeight", null);
                                        setValue("settings.maxHeight", null);

                                        const selectedFileTypePlugin = fileTypePlugins.find(
                                            item => item.getName() === value
                                        );

                                        setMessage(selectedFileTypePlugin.getMessage());
                                    }}
                                >
                                    <Select label={"Type"}>
                                        <option value={"all"}>All</option>
                                        {selectOptions}
                                    </Select>
                                </Bind>
                            </Cell>
                            <Cell span={2}>
                                <Bind name={"settings.tags"}>
                                    <TagsAutocomplete tags={tags} types={fileTypes[fileType]} />
                                </Bind>
                            </Cell>
                            <Cell span={8}>
                                {data.settings.tags.map(tag => {
                                    return <span key={tag}>{tag}</span>;
                                })}
                            </Cell>
                        </Grid>
                        <Grid>
                            <Cell span={3} style={imagesCellStyle}>
                                <Bind name={"settings.minWidth"}>
                                    <Input label={"Min width"} description={"Min image width"} />
                                </Bind>
                            </Cell>
                            <Cell span={3} style={imagesCellStyle}>
                                <Bind name={"settings.maxWidth"}>
                                    <Input label={"Max width"} description={"Max image width"} />
                                </Bind>
                            </Cell>
                            <Cell span={3} style={imagesCellStyle}>
                                <Bind name={"settings.minHeight"}>
                                    <Input label={"Min height"} description={"Min image height"} />
                                </Bind>
                            </Cell>
                            <Cell span={3} style={imagesCellStyle}>
                                <Bind name={"settings.maxHeight"}>
                                    <Input label={"Max height"} description={"Max image height"} />
                                </Bind>
                            </Cell>
                        </Grid>
                    </>
                );
            }
        }
    };
};
