import React, { useState } from "react";
import { i18n } from "@webiny/app/i18n";
import { DeleteIcon } from "@webiny/ui/List/DataList/icons";
import { useCrud } from "@webiny/app-admin/hooks/useCrud";
import { Typography } from "@webiny/ui/Typography";
import { useCms } from "@webiny/app-headless-cms/admin/hooks";
import {
    DataList,
    List,
    ListItem,
    ListItemText,
    ListItemTextSecondary,
    ListItemMeta,
    ListActions
} from "@webiny/ui/List";
import { ReactComponent as InformationIcon } from "../../icons/info.svg";
import { Link } from "@webiny/react-router";
import { ConfirmationDialogWithInput } from "./ConfirmationDialogWithInput";
import styled from "@emotion/styled";
import { css } from "emotion";
import ApiUrlsDialog from "@webiny/app-headless-cms/admin/components/ApiUrlsDialog";

const t = i18n.ns("app-headless-cms/admin/environments/data-list");

const Wrapper = styled("div")({
    display: "flex",
    alignItems: "baseline",
    "& a": {
        fontSize: 14,
        marginLeft: 8
    }
});

const style = {
    informationLabel: css({
        color: "var(--mdc-theme-primary)"
    }),
    icon: css({
        color: "rgba(255, 255, 255, 0.54)",
        width: 16,
        height: 16,
        marginTop: "4px",
        marginLeft: "10px"
    }),
    environmentText: css({
        display: "flex",
        flexDirection: "row"
    })
};

const getSeparator = (index, length) => {
    const lastIndex = length - 1;
    return index < lastIndex ? "," : "";
};

const EnvironmentsDataList = () => {
    const { actions, list } = useCrud();
    const [infoOpened, setInfoOpened] = useState(false);
    const [selectedInfo, setSelectedInfo] = useState({
        name: ""
    });

    const {
        environments: { refreshEnvironments, selectAvailableEnvironment, isSelectedEnvironment }
    } = useCms();

    return (
        <DataList
            {...list}
            title={t`Environments`}
            sorters={[
                {
                    label: t`Newest to oldest`,
                    sorters: { createdOn: -1 }
                },
                {
                    label: t`Oldest to newest`,
                    sorters: { createdOn: 1 }
                },
                {
                    label: t`Name A-Z`,
                    sorters: { name: 1 }
                },
                {
                    label: t`Name Z-A`,
                    sorters: { name: -1 }
                }
            ]}
        >
            {({ data, isSelected, select }) => {
                return (
                    <List data-testid="default-data-list">
                        {
                            selectedInfo.name &&
                                <ApiUrlsDialog
                                    open={infoOpened}
                                    onClose={() => setInfoOpened(false)}
                                    name={selectedInfo.name}
                                    type="environment"
                                />
                        }
                        {data.map(item => (
                            <ListItem key={item.id} selected={isSelected(item)}>
                                <ListItemText onClick={() => select(item)}>
                                    <div className={style.environmentText}>
                                        {item.name}{" "}
                                        <Typography use={"caption"} className={style.informationLabel}>
                                            <div onClick={e => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                setInfoOpened(true);
                                                setSelectedInfo(item);
                                            }}>
                                                <InformationIcon className={style.icon}/>
                                            </div>
                                        </Typography>
                                    </div>
                                    {item.default && (
                                        <Typography use={"overline"}>{t`(default)`}</Typography>
                                    )}
                                    <Wrapper>
                                        <ListItemTextSecondary>
                                            {item.environmentAliases &&
                                            item.environmentAliases.length
                                                ? t`Assigned to:`
                                                : t`Not linked with an alias.`}
                                        </ListItemTextSecondary>
                                        {item.environmentAliases &&
                                            item.environmentAliases.map((envAlias, index) => (
                                                <Link
                                                    key={envAlias.id}
                                                    onClick={e => e.stopPropagation()}
                                                    to={`/settings/cms/environments/aliases?id=${envAlias.id}`}
                                                    title={t`This environment is linked with the "{environmentAlias}" alias.`(
                                                        {
                                                            environmentAlias: envAlias.name
                                                        }
                                                    )}
                                                >
                                                    {envAlias.name}
                                                    {getSeparator(
                                                        index,
                                                        item.environmentAliases.length
                                                    )}
                                                </Link>
                                            ))}
                                    </Wrapper>
                                </ListItemText>

                                <ListItemMeta>
                                    <ListActions>
                                        <ConfirmationDialogWithInput
                                            title={"Remove environment"}
                                            message={t`This action {verb} be undone. This will permanently delete the {name} environment and all of the created content.`(
                                                { name: <b>{item.name}</b>, verb: <b>cannot</b> }
                                            )}
                                            resourceName={item.name}
                                        >
                                            {({ showConfirmation }) => (
                                                <DeleteIcon
                                                    onClick={() => {
                                                        showConfirmation(async () => {
                                                            // If we deleted the environment that was currently selected,
                                                            // let's automatically switch to the first available one.
                                                            await actions.delete(item);

                                                            if (isSelectedEnvironment(item)) {
                                                                selectAvailableEnvironment([item]);
                                                            }

                                                            refreshEnvironments();
                                                        });
                                                    }}
                                                />
                                            )}
                                        </ConfirmationDialogWithInput>
                                    </ListActions>
                                </ListItemMeta>
                            </ListItem>
                        ))}
                    </List>
                );
            }}
        </DataList>
    );
};

export default EnvironmentsDataList;
