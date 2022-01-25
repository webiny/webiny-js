import React from "react";
import { css } from "emotion";
import { Tab, Tabs } from "@webiny/ui/Tabs";
import { Box, Stack } from "~/admin/components/Layout";
import { Typography } from "@webiny/ui/Typography";
import { CheckboxGroup } from "@webiny/ui/Checkbox";
import { Scrollbar } from "@webiny/ui/Scrollbar";
import { ListItemWithCheckbox } from "~/admin/views/publishingWorkflows/components/ReviewersList";
import { InputField } from "~/admin/views/publishingWorkflows/components/Styled";
import { Elevation } from "@webiny/ui/Elevation";
import { BindComponent } from "@webiny/form";
import { ListItemWithRemove } from "./WorkflowScope";
import { usePbCategories } from "~/admin/views/publishingWorkflows/hooks/usePbCategories";
import { usePbPages } from "~/admin/views/publishingWorkflows/hooks/usePbPages";

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

interface PbCategoriesProps {
    Bind: BindComponent;
}

const PbCategories: React.FC<PbCategoriesProps> = ({ Bind }) => {
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
                <Bind name={"scope.data.categories"}>
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
    Bind: BindComponent;
}

const PbPagesList: React.FC<PbPagesListProps> = () => {
    const { pages, loading, query, setQuery } = usePbPages();
    return (
        <Stack space={6} padding={6}>
            <Box>
                <Typography
                    use={"subtitle2"}
                    className={textStyle}
                >{`This workflow applies to specific pages only.`}</Typography>
            </Box>
            <Stack space={3.5}>
                <Box>
                    <InputField
                        type={"text"}
                        placeholder={"Search pages"}
                        value={query}
                        onChange={({ target: { value } }) => setQuery(value)}
                    />
                </Box>
                <Box>
                    <Scrollbar
                        style={{
                            width: "100%",
                            height: "180px"
                        }}
                    >
                        {loading ? (
                            <Typography use={"overline"}>Loading pages...</Typography>
                        ) : (
                            pages.map((page, index) => (
                                <ListItemWithRemove
                                    key={index}
                                    label={page.title}
                                    order={`#${index + 1}.`}
                                />
                            ))
                        )}
                    </Scrollbar>
                </Box>
            </Stack>
        </Stack>
    );
};

interface PbScopeSettingsProps {
    Bind: any;
}

const PbScopeSettings: React.FC<PbScopeSettingsProps> = ({ Bind }) => {
    return (
        <Elevation z={1}>
            <Tabs className={tabStyles}>
                <Tab label={"Page Categories"}>
                    <PbCategories Bind={Bind} />
                </Tab>
                <Tab label={"Specific Pages"}>
                    <PbPagesList Bind={Bind} />
                </Tab>
            </Tabs>
        </Elevation>
    );
};

export default PbScopeSettings;
