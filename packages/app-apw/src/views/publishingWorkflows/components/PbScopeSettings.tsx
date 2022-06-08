import React from "react";
import noop from "lodash/noop";
import { css } from "emotion";
import { Tab, Tabs } from "@webiny/ui/Tabs";
import { Typography } from "@webiny/ui/Typography";
import { CheckboxGroup } from "@webiny/ui/Checkbox";
import { Scrollbar } from "@webiny/ui/Scrollbar";
import { MultiAutoComplete } from "@webiny/ui/AutoComplete";
import { Elevation } from "@webiny/ui/Elevation";
import { BindComponent } from "@webiny/form";
import { Box, Stack } from "~/components/Layout";
import { ListItemWithCheckbox } from "./ReviewersList";
import { usePbCategories } from "~/hooks/usePbCategories";
import { usePbPages } from "~/hooks/usePbPages";
import { validation } from "@webiny/validation";
import { BindComponentRenderProp } from "@webiny/form";

const textStyle = css`
    color: var(--mdc-theme-text-secondary-on-background);
`;

const tabStyles = css`
    .mdc-tab-indicator__content--underline {
        align-self: flex-start;
    }

    .mdc-tab-indicator {
        background-color: var(--mdc-theme-background);
    }

    .mdc-tab-indicator--active {
        background-color: var(--mdc-theme-surface);
    }
`;

type PbCategoriesProps = PbScopeSettingsProps;

const PbCategories: React.FC<PbCategoriesProps> = ({ Bind, runValidation }) => {
    const { categories, loading } = usePbCategories();
    return (
        <Stack space={3} padding={6}>
            <Box>
                <Typography
                    use={"subtitle2"}
                    className={textStyle}
                >{`This workflow will apply to all pages inside the selected categories, unless a page has a specific workflow applied to it.`}</Typography>
            </Box>
            <Box>
                <Bind
                    name={"scope.data.categories"}
                    validators={runValidation ? validation.create("minLength:1") : noop}
                >
                    <CheckboxGroup>
                        {({ getValue, onChange }) => (
                            <Scrollbar style={{ width: "100%", height: "160px" }}>
                                {loading ? (
                                    <Typography use={"overline"}>Loading categories...</Typography>
                                ) : (
                                    categories.map((category, index) => (
                                        <ListItemWithCheckbox
                                            key={index}
                                            label={category.name}
                                            value={getValue(category.slug)}
                                            onChange={onChange(category.slug)}
                                        />
                                    ))
                                )}
                            </Scrollbar>
                        )}
                    </CheckboxGroup>
                </Bind>
            </Box>
        </Stack>
    );
};

interface PbPagesListProps {
    bind: BindComponentRenderProp;
    runValidation: boolean;
}

const PbPagesList: React.FC<PbPagesListProps> = ({ bind }) => {
    const { loading, setQuery, options, value } = usePbPages({ bind });
    return (
        <Stack space={6} padding={6}>
            <Box>
                <Typography
                    use={"subtitle2"}
                    className={textStyle}
                >{`This workflow applies to specific pages only.`}</Typography>
            </Box>
            <Box>
                <MultiAutoComplete
                    {...bind}
                    value={value}
                    label={"Pages"}
                    options={options}
                    useMultipleSelectionList={true}
                    useSimpleValues={false}
                    loading={loading}
                    textProp={"title"}
                    onInput={(search: string) => setQuery(search)}
                />
            </Box>
        </Stack>
    );
};

interface PbScopeSettingsProps {
    Bind: BindComponent;
    runValidation: boolean;
}

const PbScopeSettings: React.FC<PbScopeSettingsProps> = ({ Bind, runValidation }) => {
    return (
        <Elevation z={1}>
            <Tabs className={tabStyles}>
                <Tab label={"Page Categories"}>
                    <PbCategories Bind={Bind} runValidation={runValidation} />
                </Tab>
                <Tab label={"Specific Pages"}>
                    <Bind
                        name={"scope.data.pages"}
                        validators={runValidation ? validation.create("minLength:1") : noop}
                        beforeChange={(pages, onChange) => {
                            onChange(pages.map((item: any) => item.pid));
                        }}
                    >
                        {bind => <PbPagesList bind={bind} runValidation={runValidation} />}
                    </Bind>
                </Tab>
            </Tabs>
        </Elevation>
    );
};

export default PbScopeSettings;
