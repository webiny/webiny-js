import React, { useMemo } from "react";
import styled from "@emotion/styled";
import get from "lodash/get";

import { Input } from "@webiny/ui/Input";
import { ButtonIcon, ButtonSecondary, ButtonPrimary } from "@webiny/ui/Button";
import { BindComponent } from "@webiny/form/types";

import { ReactComponent as InfoIcon } from "@material-design-icons/svg/outlined/info.svg";
import { ReactComponent as DatabaseIcon } from "@material-symbols/svg-400/rounded/database.svg";

import { FilterSettings } from "./FilterSettings";
import { SortRuleSettings } from "./SortRuleSettings";
import { ModelSelect } from "~/components/Select/ModelSelect";
import { ElementStatusWrapper } from "~/components/common/ElementStatusWrapper";
import { UnlinkElementWrapper } from "~/components/common/UnlinkElementWrapper";
import { SettingsWrapper, SettingsTitle, InputWrapper } from "./Settings.styles";

const DynamicSourceSettingsWrapper = styled.div`
    display: grid;
    row-gap: 24px;
    padding: 16px 16px 120px 16px;
`;

const SourceSettingsWrapper = styled.div`
    display: grid;
    row-gap: 6px;
`;

const ButtonSecondaryStyled = styled(ButtonSecondary)`
    background: white !important;
`;

type DynamicSourceSettingsProps = {
    Bind: BindComponent;
    submit: () => void;
    data: Record<string, any>;
    onUnlink?: () => void;
};

export const DynamicSourceSettings: React.FC<DynamicSourceSettingsProps> = ({
    Bind,
    submit,
    data,
    onUnlink
}) => {
    const isDynamic = useMemo(() => {
        return Boolean(get(data, "dynamicSource"));
    }, [data]);

    const selectedModelId = useMemo(() => {
        return get(data, "dynamicSource.modelId");
    }, [data]);

    return (
        <DynamicSourceSettingsWrapper>
            {isDynamic ? (
                <>
                    <SourceSettingsWrapper>
                        <span>Source:</span>
                        <Bind name={"dynamicSource"} afterChange={submit}>
                            {({ value, onChange }) => (
                                <ModelSelect
                                    value={value?.modelId}
                                    onChange={modelId => {
                                        onChange({ modelId });
                                        if (onUnlink) {
                                            onUnlink();
                                        }
                                    }}
                                />
                            )}
                        </Bind>
                    </SourceSettingsWrapper>
                    {selectedModelId && (
                        <>
                            <Bind name={"dynamicSource.filter"} afterChange={submit}>
                                {({ value, onChange }) => (
                                    <FilterSettings
                                        sourceModelId={selectedModelId}
                                        value={value}
                                        onChange={value => onChange(value)}
                                    />
                                )}
                            </Bind>
                            <Bind name={"dynamicSource.sortRules"} afterChange={submit}>
                                {({ value, onChange }) => (
                                    <SortRuleSettings
                                        sourceModelId={selectedModelId}
                                        value={value || []}
                                        onChange={value => onChange(value)}
                                    />
                                )}
                            </Bind>
                            <SettingsWrapper>
                                <SettingsTitle>Results</SettingsTitle>
                                <InputWrapper>
                                    Number of results to return:
                                    <Bind name={"dynamicSource.limit"} afterChange={submit}>
                                        {({ value, onChange }) => (
                                            <Input
                                                type="number"
                                                value={value}
                                                placeholder="All"
                                                onChange={value => {
                                                    if (value === "") {
                                                        onChange(undefined);
                                                    } else {
                                                        onChange(Number(value));
                                                    }
                                                }}
                                            />
                                        )}
                                    </Bind>
                                </InputWrapper>
                            </SettingsWrapper>
                        </>
                    )}
                    <UnlinkElementWrapper>
                        <span className="unlink-title">Element is dynamic</span>
                        <div>
                            <Bind name={"dynamicSource"} afterChange={submit}>
                                {({ onChange }) => (
                                    <ButtonPrimary
                                        onClick={() => {
                                            onChange(undefined);
                                            if (onUnlink) {
                                                onUnlink();
                                            }
                                        }}
                                    >
                                        Unlink Dynamic
                                    </ButtonPrimary>
                                )}
                            </Bind>
                        </div>
                    </UnlinkElementWrapper>
                </>
            ) : (
                <ElementStatusWrapper>
                    <strong>Element is not dynamic</strong>
                    To allow users to change the value of this element inside a page, you need to
                    link it to a variable.
                    <div>
                        <Bind name={"dynamicSource"} afterChange={submit}>
                            {({ onChange }) => (
                                <ButtonSecondaryStyled onClick={() => onChange({})}>
                                    <ButtonIcon icon={<DatabaseIcon />} />
                                    Make Dynamic
                                </ButtonSecondaryStyled>
                            )}
                        </Bind>
                    </div>
                    <div className="info-wrapper">
                        <InfoIcon /> Click here to learn more about how block variables work
                    </div>
                </ElementStatusWrapper>
            )}
        </DynamicSourceSettingsWrapper>
    );
};
