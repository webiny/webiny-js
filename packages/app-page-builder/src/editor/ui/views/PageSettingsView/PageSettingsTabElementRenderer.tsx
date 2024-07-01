import React from "react";
import styled from "@emotion/styled";
import { css } from "emotion";
import { UIRenderer, UIRenderParams } from "@webiny/app-admin/ui/UIRenderer";
import { ListItem, ListItemGraphic } from "@webiny/ui/List";
import { Icon } from "@webiny/ui/Icon";
import { Typography } from "@webiny/ui/Typography";
import { PageSettingsView } from "../PageSettingsView";
import { PageSettingsTabElement } from "./PageSettingsTabElement";

export const listItem = css({
    padding: "15px 20px",
    cursor: "pointer",
    borderBottom: "1px solid var(--mdc-theme-background)",
    "&:last-child": {
        borderBottom: "none"
    },
    ".mdc-deprecated-list-item__graphic": {
        marginRight: 20
    }
});

export const ListItemTitle = styled("div")({
    fontWeight: 600,
    marginBottom: 5
});

export const TitleContent = styled("div")({
    display: "flex",
    flexDirection: "column"
});

export class PageSettingsTabElementRenderer extends UIRenderer<PageSettingsTabElement> {
    public render({ element }: UIRenderParams<PageSettingsTabElement>): React.ReactNode {
        const { setActiveSection } = element
            .getView<PageSettingsView>(PageSettingsView)
            .getPageSettingsHook();

        return (
            <ListItem
                key={element.id}
                className={listItem}
                onClick={() => setActiveSection(element.id)}
            >
                <ListItemGraphic>
                    <Icon icon={element.config.icon} />
                </ListItemGraphic>
                <TitleContent>
                    <ListItemTitle>{element.config.title}</ListItemTitle>
                    <Typography use={"body2"}>{element.config.description}</Typography>
                </TitleContent>
            </ListItem>
        );
    }
}
