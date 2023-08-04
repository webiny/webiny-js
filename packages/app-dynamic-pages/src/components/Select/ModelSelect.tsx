import React, { useMemo, useCallback } from "react";
import styled from "@emotion/styled";

import { Icon } from "@webiny/ui/Icon";
import { Menu } from "@webiny/ui/Menu";
import { useContentModelGroups } from "@webiny/app-headless-cms";
import { CmsModel } from "@webiny/app-headless-cms/types";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { ReactComponent as ArrowDownIcon } from "@material-design-icons/svg/round/arrow_drop_down.svg";
import { ReactComponent as DataBaseIcon } from "@material-symbols/svg-400/rounded/database.svg";

import { Loader } from "~/components/common/Loader";
import {
    DropDownGroupHeading,
    DropDownOption,
    DropDownOptionWrapper,
    DropDownOptionIcon,
    DropDownOptions,
    DropDownOptionSubTitle,
    DropDownOptionTextContent,
    DropDownOptionTitle,
    DropDownMenu,
    LoaderWrapper
} from "./Select.styles";

const MenuWrapper = styled.div`
    .mdc-menu-surface {
        width: 100%;
        max-height: calc(100vh - 297px) !important;
        top: 52px !important;
        box-shadow: none;
    }
`;

interface ModelIconProps {
    model: CmsModel;
}
const ModelIcon: React.FC<ModelIconProps> = ({ model }) => {
    return (
        <FontAwesomeIcon
            style={{ color: "var(--mdc-theme-text-secondary-on-background)" }}
            icon={(model.icon || "fas/star").split("/") as IconProp}
            width={24}
            height={24}
        />
    );
};

type ModelSelectProps = {
    value: string;
    onChange: (value: string) => void;
};

export const ModelSelect: React.FC<ModelSelectProps> = ({ value, onChange }) => {
    const { groups, loading } = useContentModelGroups();

    const selectedModelName = useMemo(() => {
        for (const group of groups) {
            const found = group.contentModels.find(
                contentModel => contentModel.modelId === value
            )?.name;

            if (found) {
                return found;
            }
        }

        return "Select a source";
    }, [groups, value]);

    const handleModelSelect = useCallback((modelId: string) => {
        onChange(modelId);
    }, []);

    return (
        <MenuWrapper>
            <Menu
                handle={
                    <DropDownMenu disabled={loading}>
                        <Icon className="db-icon" icon={<DataBaseIcon width={24} height={24} />} />
                        <span>{selectedModelName}</span>
                        {loading && (
                            <LoaderWrapper>
                                <Loader />
                            </LoaderWrapper>
                        )}
                        <Icon className="arrow-down" icon={<ArrowDownIcon />} />
                    </DropDownMenu>
                }
            >
                {({ closeMenu }: { closeMenu: () => void }) => {
                    return (
                        <>
                            {groups.map((group, index) => (
                                <div key={index}>
                                    <DropDownGroupHeading>
                                        <span>{group.name}</span>
                                    </DropDownGroupHeading>

                                    <DropDownOptions>
                                        {group.contentModels.map((model, index) => (
                                            <DropDownOptionWrapper
                                                key={index}
                                                isActive={model.modelId === value}
                                            >
                                                <DropDownOption
                                                    onClick={() => {
                                                        handleModelSelect(model.modelId);
                                                        closeMenu();
                                                    }}
                                                >
                                                    <DropDownOptionIcon>
                                                        <ModelIcon model={model} />
                                                    </DropDownOptionIcon>
                                                    <DropDownOptionTextContent>
                                                        <DropDownOptionTitle>
                                                            {model.name}
                                                        </DropDownOptionTitle>
                                                        <DropDownOptionSubTitle>
                                                            {model.description}
                                                        </DropDownOptionSubTitle>
                                                    </DropDownOptionTextContent>
                                                </DropDownOption>
                                            </DropDownOptionWrapper>
                                        ))}
                                    </DropDownOptions>
                                </div>
                            ))}
                        </>
                    );
                }}
            </Menu>
        </MenuWrapper>
    );
};
