import React from "react";
import styled from "@emotion/styled";
import { css } from "emotion";
import { Link } from "@webiny/react-router";
import { hasMenuItems } from "../Menu";

function trackGoToGithub({}: { placement: string }) {
    // @ts-ignore
    if (window.wts) {
        // @ts-ignore
        window.wts.trackEvent("website-action", { action: "Go to GitHub" });
    }
    // @ts-ignore
    window.gtag("config", "UA-35527198-1", {
        page_title: "Go to GitHub",
        page_path: "/goal-ga-github"
    });
}

const ContentContainer = styled.div`
    position: relative;
    width: 100%;
    max-width: 1200px;
    margin: 0 auto;
`;

const MenuBlock = styled("div")({
    width: "auto",
    display: "flex",
    flexDirection: "column",
    lineHeight: "30px",
    a: {
        fontSize: 16,
        lineHeight: "30px",
        color: "var(--webiny-theme-color-surface)",
        textDecoration: "none",
        "&:hover": {
            textDecoration: "underline"
        }
    }
});

const SectionTitle = styled("span")({
    fontSize: 16,
    lineHeight: "30px",
    fontWeight: 600,
    display: "inline-block",
    marginBottom: 15
});

const footerMenu = css`
    max-width: 100%;
    display: flex;
    justify-content: space-between;
    color: var(--webiny-theme-color-surface);
    padding-bottom: 50px;

    .webiny-pb-media-query--mobile-landscape &,
    .webiny-pb-media-query--mobile-portrait & {
        display: none;
    }
`;
const externalProtocols = ["https:", "http:", "mailto:"];

interface CustomLinkProps {
    url: string;
    title: string;
}

export const CustomLink: React.FunctionComponent<CustomLinkProps> = ({ url, title }) => {
    const isExternal = externalProtocols.some(p => url.startsWith(p));

    let onClick = null;
    if (url.includes("github.com")) {
        onClick = () => trackGoToGithub({ placement: "footer-menu" });
    }

    if (isExternal) {
        return (
            <a onClick={onClick} href={url} rel={"noreferrer noopener"} target={"_blank"}>
                {title}
            </a>
        );
    }

    return (
        <Link to={url} rel="prerender">
            {title}
        </Link>
    );
};

export interface FooterMenuProps {
    data: {
        items: any[];
        title: string | null;
        slug: string | null;
    };
}

const FooterMenu: React.FunctionComponent<FooterMenuProps> = ({ data }) => {
    /**
     * Bail out early if there are no menu items.
     */
    if (!hasMenuItems(data)) {
        return null;
    }

    return (
        <ContentContainer className={footerMenu}>
            {data.items.map(item => {
                return (
                    <MenuBlock key={item.id}>
                        <SectionTitle>{item.title}</SectionTitle>
                        {item.children.map(menuItem => (
                            <CustomLink key={menuItem.id} {...menuItem} />
                        ))}
                    </MenuBlock>
                );
            })}
        </ContentContainer>
    );
};

export default FooterMenu;
