import React from "react";
import styled from "@emotion/styled";
import { css } from "emotion";
import { Link } from "@webiny/react-router";

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

const FooterMenu = () => (
    <ContentContainer className={footerMenu}>
        <MenuBlock>
            <SectionTitle>Developers</SectionTitle>
            <a href="/docs/webiny/introduction/">Documentation</a>
            <a
                onClick={() => {
                    trackGoToGithub({ placement: "footer-menu" });
                }}
                href="https://github.com/webiny/webiny-js/blob/master/LICENSE"
            >
                License
            </a>
            <a
                onClick={() => {
                    trackGoToGithub({ placement: "footer-menu" });
                }}
                href="https://github.com/webiny/webiny-js"
            >
                GitHub repository
            </a>
            <a
                onClick={() => {
                    trackGoToGithub({ placement: "footer-menu" });
                }}
                href="https://github.com/webiny/webiny-js/blob/master/docs/CONTRIBUTING.md"
            >
                Contribute
            </a>
        </MenuBlock>
        <MenuBlock>
            <SectionTitle>Webiny</SectionTitle>
            <Link to="/serverless-application-framework">
                Serverless Application
                <br />
                Framework
            </Link>
            <Link to="/serverless-cms">Serverless CMS</Link>
            <Link to="/enterprise">For Enterprise</Link>
            <Link to="/why-webiny">Why Webiny?</Link>
            <Link to="/partners">Webiny Partners</Link>
            <Link to="/roadmap">Roadmap</Link>
        </MenuBlock>
        <MenuBlock>
            <SectionTitle>Community</SectionTitle>
            <a href="https://www.webiny.com/slack">Slack Chat</a>
            <Link to="/blog">Blog</Link>
            <Link to="/swag">SWAG</Link>
            <Link to="/events">Events</Link>
        </MenuBlock>
        <MenuBlock>
            <SectionTitle>Use Cases & Guides</SectionTitle>
            <Link rel="prerender" to="/use-case/serverless-websites">
                Build Serverless Websites
            </Link>
            <Link rel="prerender" to="/use-case/serverless-web-applications">
                Build Serverless Apps
            </Link>
            <Link rel="prerender" to="/use-case/serverless-graphql-api">
                Build Serverless APIs
            </Link>
            <Link rel="prerender" to="/use-case/microservices">
                Build Microservices
            </Link>
            <Link rel="prerender" to="/guides/serverless-guide">
                Guide to Serverless
            </Link>
        </MenuBlock>
        <MenuBlock>
            <SectionTitle>Company</SectionTitle>
            <Link rel="prerender" to="/about-us">
                About Us
            </Link>
            <a href="https://careers.webiny.com">Careers</a>
            <Link rel="prerender" to="/privacy-policy">
                Privacy Policy
            </Link>
            <a href="mailto:sven@webiny.com">Contact Us</a>
        </MenuBlock>
    </ContentContainer>
);

export default FooterMenu;
