import React from "react";
import { css } from "emotion";
import classNames from "classnames";
import { Tabs, Tab } from "@webiny/ui/Tabs";
import { Typography } from "@webiny/ui/Typography";
import { Cell, Grid } from "@webiny/ui/Grid";
import { Checkbox } from "@webiny/ui/Checkbox";
import { Elevation } from "@webiny/ui/Elevation";
import { IconButton } from "@webiny/ui/Button";
import { ReactComponent as CloseIcon } from "~/admin/assets/icons/close_24dp.svg";
import { Box, Columns, Stack } from "./theme";
import { CheckboxWrapper, restGridStyles, InputField } from "./Styled";
import { Scrollbar } from "@webiny/ui/Scrollbar";

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

interface ListItemWithCheckboxProps {
    label: string;
    prefix?: string;
}

const ListItemWithCheckbox: React.FC<ListItemWithCheckboxProps> = ({ label }) => {
    return (
        <Grid className={restGridStyles}>
            <Cell span={6} align={"middle"}>
                <Box>
                    <Typography use={"subtitle1"}>{label}</Typography>
                </Box>
            </Cell>
            <Cell span={6}>
                <CheckboxWrapper>
                    <Checkbox />
                </CheckboxWrapper>
            </Cell>
        </Grid>
    );
};

const ListItemWithRemove: React.FC<ListItemWithCheckboxProps> = ({ label, prefix }) => {
    return (
        <Grid className={classNames(restGridStyles, borderStyle)}>
            <Cell span={9} align={"middle"}>
                <Columns space={1}>
                    <Box>
                        <Typography className={textStyle} use={"subtitle2"}>
                            {prefix}
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

function WorkflowScope() {
    return (
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
                            <Scrollbar style={{ width: "100%", height: "160px" }}>
                                {[...CATEGORIES, ...CATEGORIES, ...CATEGORIES].map(
                                    (category, index) => (
                                        <ListItemWithCheckbox key={index} label={category.name} />
                                    )
                                )}
                                -
                            </Scrollbar>
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
                                <InputField type={"text"} placeholder={"Search pages"} />
                            </Box>
                            <Box>
                                <Scrollbar style={{ width: "100%", height: "180px" }}>
                                    {[...PAGES, ...PAGES, ...PAGES].map((page, index) => (
                                        <ListItemWithRemove
                                            key={index}
                                            label={page.title}
                                            prefix={`#${index + 1}.`}
                                        />
                                    ))}
                                </Scrollbar>
                            </Box>
                        </Stack>
                    </Stack>
                </Tab>
            </Tabs>
        </Elevation>
    );
}

export default WorkflowScope;
