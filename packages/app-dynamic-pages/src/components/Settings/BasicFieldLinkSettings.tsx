import React, { useMemo } from "react";
import styled from "@emotion/styled";
import get from "lodash/get";

import { ButtonIcon, ButtonSecondary, ButtonPrimary } from "@webiny/ui/Button";
import { BindComponent } from "@webiny/form/types";

import { ReactComponent as InfoIcon } from "@material-design-icons/svg/outlined/info.svg";
import { ReactComponent as DatabaseIcon } from "@material-symbols/svg-400/rounded/database.svg";

import { FieldSelect } from "~/components/Select/FieldSelect";
import { ElementStatusWrapper } from "~/components/common/ElementStatusWrapper";
import { UnlinkElementWrapper } from "~/components/common/UnlinkElementWrapper";

const BasicFieldLinkSettingsWrapper = styled.div`
    display: grid;
    row-gap: 24px;
    padding: 16px;
`;

const ButtonSecondaryStyled = styled(ButtonSecondary)`
    background: white !important;
`;

const FieldSelectWrapper = styled.div`
    display: grid;
    row-gap: 6px;
`;

type BasicFieldLinkSettingsProps = {
    Bind: BindComponent;
    submit: () => void;
    data: Record<string, any>;
    sourceModelId?: string;
    onUnlink?: () => void;
    allowedFields?: string[];
};

export const BasicFieldLinkSettings: React.FC<BasicFieldLinkSettingsProps> = ({
    Bind,
    submit,
    data,
    sourceModelId,
    onUnlink,
    allowedFields
}) => {
    const isLinked = useMemo(() => {
        return Boolean(get(data, "dynamicSource"));
    }, [data]);

    return (
        <BasicFieldLinkSettingsWrapper>
            {isLinked ? (
                <>
                    <FieldSelectWrapper>
                        <span>Field:</span>
                        <Bind name={"dynamicSource.path"} afterChange={submit}>
                            {({ value, onChange }) => (
                                <FieldSelect
                                    sourceModelId={sourceModelId || ""}
                                    value={value}
                                    onChange={value => onChange(value)}
                                    allowedFields={allowedFields}
                                />
                            )}
                        </Bind>
                    </FieldSelectWrapper>
                    <UnlinkElementWrapper>
                        <span className="unlink-title">Element is linked</span>
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
                                        Unlink Element
                                    </ButtonPrimary>
                                )}
                            </Bind>
                        </div>
                        <div className="info-wrapper">
                            <InfoIcon /> Click here to learn more about how block variables work
                        </div>
                    </UnlinkElementWrapper>
                </>
            ) : (
                <ElementStatusWrapper>
                    <strong>Element not linked</strong>
                    To allow users to change the value of this element inside a page, you need to
                    link it to a variable.
                    <div>
                        <Bind name={"dynamicSource"} afterChange={submit}>
                            {({ onChange }) => (
                                <ButtonSecondaryStyled onClick={() => onChange({})}>
                                    <ButtonIcon icon={<DatabaseIcon />} />
                                    Link to a CMS field
                                </ButtonSecondaryStyled>
                            )}
                        </Bind>
                    </div>
                    <div className="info-wrapper">
                        <InfoIcon /> Click here to learn more about how block variables work
                    </div>
                </ElementStatusWrapper>
            )}
        </BasicFieldLinkSettingsWrapper>
    );
};
