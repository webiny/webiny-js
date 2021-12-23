import React from "react";
import { css } from "emotion";
import classNames from "classnames";
import { Tab, Tabs } from "@webiny/ui/Tabs";
import { Typography } from "@webiny/ui/Typography";
import { Cell, Grid } from "@webiny/ui/Grid";
import { CheckboxGroup } from "@webiny/ui/Checkbox";
import { Elevation } from "@webiny/ui/Elevation";
import { IconButton } from "@webiny/ui/Button";
import { ReactComponent as CloseIcon } from "~/admin/assets/icons/close_24dp.svg";
import { Box, Columns, Stack } from "./theme";
import { CheckboxWrapper, InputField, restGridStyles } from "./Styled";
import { Scrollbar } from "@webiny/ui/Scrollbar";
import { BindComponent } from "@webiny/form";
import { Select } from "@webiny/ui/Select";
import { validation } from "@webiny/validation";
import { ApwWorkflowScopeTypes } from "~/types";
import { i18n } from "@webiny/app/i18n";
import { ListItemWithCheckbox } from "./ReviewersList";

const t = i18n.ns("app-apw/admin/publishing-workflows/form");

const textStyle = css`
    color: var(--mdc-theme-text-secondary-on-background);
`;

const borderStyle = css`
    border-bottom: 1px solid var(--mdc-theme-on-background);

    &:last-child {
        border-bottom: none;
    }
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

interface ListItemWithRemoveProps {
    label: string;
    order: string;
}

const ListItemWithRemove: React.FC<ListItemWithRemoveProps> = ({ label, order }) => {
    return (
        <Grid className={classNames(restGridStyles, borderStyle)}>
            <Cell span={9} align={"middle"}>
                <Columns space={1}>
                    <Box>
                        <Typography className={textStyle} use={"subtitle2"}>
                            {order}
                        </Typography>
                    </Box>
                    <Box>
                        <Typography className={textStyle} use={"subtitle2"}>
                            {label}
                        </Typography>
                    </Box>
                </Columns>
            </Cell>
            <Cell span={3}>
                <CheckboxWrapper>
                    <IconButton icon={<CloseIcon />} />
                </CheckboxWrapper>
            </Cell>
        </Grid>
    );
};

const PAGES = [
    { title: "Golden product page that has lot’s of views.", id: 1 },
    { title: "Golden product page that has lot’s of views.", id: 2 },
    { title: "Golden product page that has lot’s of views.", id: 3 },
    { title: "Golden product page that has lot’s of views.", id: 4 }
];

const CATEGORIES = [
    { name: "Static pages", slug: "/static" },
    {
        name: "Dynamic pages",
        slug: "/dynamic"
    }
];

interface WorkflowScopeProps {
    Bind: BindComponent;
    type: ApwWorkflowScopeTypes;
}

function WorkflowScope({ Bind, type }: WorkflowScopeProps) {
    return (
        <Stack space={6}>
            <Box>
                <Bind name={`scope.type`} validators={validation.create("required")}>
                    <Select label={"Type"} box={"true"}>
                        <option value={""} disabled={true} hidden={true} />
                        <option value={ApwWorkflowScopeTypes.DEFAULT}>{t`Default`}</option>
                        <option value={ApwWorkflowScopeTypes.PB}>{t`Page Builder`}</option>
                    </Select>
                </Bind>
            </Box>
            <Box>
                {type === ApwWorkflowScopeTypes.PB && (
                    <Elevation z={1}>
                        <Tabs className={tabStyles}>
                            <Tab label={"Page Categories"}>
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
                                                    <Scrollbar
                                                        style={{ width: "100%", height: "160px" }}
                                                    >
                                                        {CATEGORIES.map((category, index) => (
                                                            <ListItemWithCheckbox
                                                                key={index}
                                                                label={category.name}
                                                                value={getValue(category.slug)}
                                                                onChange={onChange(category.slug)}
                                                            />
                                                        ))}
                                                    </Scrollbar>
                                                )}
                                            </CheckboxGroup>
                                        </Bind>
                                    </Box>
                                </Stack>
                            </Tab>
                            <Tab label={"Specific Pages"}>
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
                                            />
                                        </Box>
                                        <Box>
                                            <Scrollbar
                                                style={{
                                                    width: "100%",
                                                    height: "180px"
                                                }}
                                            >
                                                {PAGES.map((page, index) => (
                                                    <ListItemWithRemove
                                                        key={index}
                                                        label={page.title}
                                                        order={`#${index + 1}.`}
                                                    />
                                                ))}
                                            </Scrollbar>
                                        </Box>
                                    </Stack>
                                </Stack>
                            </Tab>
                        </Tabs>
                    </Elevation>
                )}
            </Box>
        </Stack>
    );
}

export default WorkflowScope;
