import React, { useCallback } from "react";
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
import { ListItemWithCheckbox } from "../ListItemWithCheckbox";
import { validation } from "@webiny/validation";
import { BindComponentRenderProp } from "@webiny/form";
import { useCmsModels } from "~/hooks/useCmsModels";
import { CmsEntryOption, useCmsEntries } from "~/hooks/useCmsEntries";
import { CmsModel } from "~/types";

const textStyle = css`
    color: var(--mdc-theme-text-secondary-on-background);
`;

const entryNameStyle = css`
    display: block;
`;
const modelNameStyle = css`
    display: block;
    color: var(--mdc-theme-text-secondary-on-background);
    font-size: 11px;
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

interface CmsModelsListProps extends CmsScopeSettingsProps {
    models: CmsModel[];
    loading: boolean;
}

const CmsModelsList: React.FC<CmsModelsListProps> = ({ Bind, runValidation, models, loading }) => {
    return (
        <Stack space={3} padding={6}>
            <Box>
                <Typography use={"subtitle2"} className={textStyle}>
                    This workflow will apply to all entries inside the selected models, unless an
                    entry has a specific workflow applied to it.
                </Typography>
            </Box>
            <Box>
                <Bind
                    name={"scope.data.models"}
                    validators={runValidation ? validation.create("minLength:1") : noop}
                >
                    <CheckboxGroup>
                        {({ getValue, onChange }) => (
                            <Scrollbar style={{ width: "100%", height: "160px" }}>
                                {loading && (
                                    <Typography use={"overline"}>Loading models...</Typography>
                                )}
                                {!loading &&
                                    models.map((model, index) => (
                                        <ListItemWithCheckbox
                                            key={index}
                                            label={model.name}
                                            value={getValue(model.modelId)}
                                            onChange={onChange(model.modelId)}
                                        />
                                    ))}
                            </Scrollbar>
                        )}
                    </CheckboxGroup>
                </Bind>
            </Box>
        </Stack>
    );
};

interface CmsEntriesListProps {
    bind: BindComponentRenderProp;
    runValidation: boolean;
    models: CmsModel[];
}

const CmsEntriesList: React.FC<CmsEntriesListProps> = ({ bind, models }) => {
    const { loading, setQuery, options, value } = useCmsEntries({
        bind,
        models
    });

    const render = useCallback((item: CmsEntryOption) => {
        return (
            <div>
                <div className={entryNameStyle}>{item.name}</div>
                <div className={modelNameStyle}>Model: {item.model.name}</div>
            </div>
        );
    }, []);

    return (
        <Stack space={6} padding={6}>
            <Box>
                <Typography
                    use={"subtitle2"}
                    className={textStyle}
                >{`This workflow applies to specific entries only.`}</Typography>
            </Box>
            <Box>
                <MultiAutoComplete
                    {...bind}
                    value={value}
                    label={"Entries"}
                    options={options}
                    useMultipleSelectionList={true}
                    useSimpleValues={false}
                    loading={loading}
                    textProp={"name"}
                    onInput={(search: string) => setQuery(search)}
                    onChange={(items: CmsEntryOption[] = []) => {
                        const values = items.map(item => {
                            return {
                                id: item.id,
                                modelId: item.model.modelId
                            };
                        });
                        bind.onChange(values);
                    }}
                    renderItem={render}
                    renderListItemLabel={render}
                />
            </Box>
        </Stack>
    );
};

interface CmsScopeSettingsProps {
    Bind: BindComponent;
    runValidation: boolean;
}

export const CmsScopeSettings: React.FC<CmsScopeSettingsProps> = ({ Bind, runValidation }) => {
    const { models = [], loading } = useCmsModels();
    return (
        <Elevation z={1}>
            <Tabs className={tabStyles}>
                <Tab label={"Cms Models"}>
                    <CmsModelsList
                        Bind={Bind}
                        runValidation={runValidation}
                        models={models}
                        loading={loading}
                    />
                </Tab>
                <Tab label={"Specific Entries"}>
                    {models.length > 0 && (
                        <Bind
                            name={"scope.data.entries"}
                            validators={runValidation ? validation.create("minLength:1") : noop}
                        >
                            {bind => (
                                <CmsEntriesList
                                    bind={bind}
                                    runValidation={runValidation}
                                    models={models}
                                />
                            )}
                        </Bind>
                    )}
                </Tab>
            </Tabs>
        </Elevation>
    );
};
