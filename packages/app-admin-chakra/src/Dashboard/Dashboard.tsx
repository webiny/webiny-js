import React, { useState } from "react";
import {
    Box,
    Container,
    ThemeProvider as WebinyThemeProvider,
    extendTheme,
    theme
} from "@webiny/ui-chakra";

// Icons
import { ReactComponent as AuditLogs } from "@material-design-icons/svg/outlined/description.svg";
import { ReactComponent as Forms } from "@material-design-icons/svg/outlined/check_box.svg";
import { ReactComponent as Cms } from "@material-design-icons/svg/outlined/dashboard.svg";
import { ReactComponent as PageBuilder } from "@material-design-icons/svg/outlined/space_dashboard.svg";
import { ReactComponent as PublishingWorkflow } from "@material-design-icons/svg/outlined/question_answer.svg";
import { ReactComponent as TenantManager } from "@material-design-icons/svg/outlined/domain.svg";
import { ReactComponent as Settings } from "@material-design-icons/svg/outlined/settings.svg";

// Boxes
import { ReactComponent as PageBuilderBox } from "../Dashboard/assets/box-page-builder.svg";
import { ReactComponent as FormBuilderBox } from "../Dashboard/assets/box-form-builder.svg";
import { ReactComponent as CmsBox } from "../Dashboard/assets/box-cms.svg";

// Content
import Content from "../Dashboard/assets/content.png";

import { LinkItemProps, Sidebar } from "~/Dashboard/Sidebar";
import { Header } from "~/Dashboard/Header";
import { Title } from "~/Dashboard/Title";
import { VerticalCardItem, VerticalCards } from "~/Dashboard/VerticalCards";
import { HorizontalCardItem, HorizontalCards } from "~/Dashboard/HorizontalCards";
import { greenTheme } from "./themes";

const linkItems: LinkItemProps[] = [
    { name: "Audit logs", icon: <AuditLogs /> },
    { name: "Forms", icon: <Forms /> },
    { name: "CMS", icon: <Cms /> },
    { name: "Page builder", icon: <PageBuilder /> },
    { name: "Publishing workflows", icon: <PublishingWorkflow /> },
    { name: "Tenant manager", icon: <TenantManager /> },
    { name: "Settings", icon: <Settings /> }
];

const verticalCards: VerticalCardItem[] = [
    {
        image: <PageBuilderBox />,
        title: "Build a page",
        description: "Build stunning landing pages with an easy to use drag and drop editor.",
        action: "Build a new page"
    },
    {
        image: <FormBuilderBox />,
        title: "Create a form",
        description: "Create forms using a drag and drop interface and track conversions.",
        action: "Create a new form"
    },
    {
        image: <CmsBox />,
        title: "Create a content model",
        description: "GraphQL based headless CMS with powerful content modeling features.",
        action: "New content model"
    }
];

const horizontalCards: HorizontalCardItem[] = [
    {
        image: Content,
        title: "Learn more about Webiny:",
        description:
            "Explore the Webiny documentation, learn about the architecture and check out code examples and guides:"
    },
    {
        image: Content,
        title: "Learn more about Webiny:",
        description:
            "Explore the Webiny documentation, learn about the architecture and check out code examples and guides:"
    }
];

export const Dashboard = () => {
    const [colorTheme, setColorTheme] = useState(theme);

    const mergedTheme = extendTheme(theme, { colors: colorTheme?.colors });

    return (
        <WebinyThemeProvider theme={mergedTheme}>
            <Sidebar linkItems={linkItems} />
            <Box ml={60} position="relative">
                <Header
                    setDefaultTheme={() => setColorTheme(theme)}
                    setCustomTheme={() => setColorTheme(greenTheme)}
                />
                <Container maxW="6xl" pt={12}>
                    <Title />
                    <VerticalCards items={verticalCards} />
                    <HorizontalCards items={horizontalCards} />
                </Container>
            </Box>
        </WebinyThemeProvider>
    );
};
