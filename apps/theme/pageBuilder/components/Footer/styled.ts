import styled from "@emotion/styled";

export const FooterContainer = styled.div`
    box-sizing: border-box;
    width: 100%;
    color: var(--webiny-theme-color-background);
    border-top: 1px solid #3b3e45;

    // Let's write some responsive code using media classes
    .webiny-pb-media-query--mobile-landscape &,
    .webiny-pb-media-query--mobile-portrait & {
        border: none;
    }
`;

export const FooterGrid = styled.div`
    box-sizing: border-box;
    display: flex;
    justify-content: space-between;
    width: 100%;
    max-width: 1200px;
    margin: 0 auto;
    padding-top: 25px;
    // Let's write some responsive code using media classes
    .webiny-pb-media-query--mobile-landscape &,
    .webiny-pb-media-query--mobile-portrait & {
        flex-direction: column;
    }
`;

export const LeftPanel = styled.div`
    // Let's write some responsive code using media classes
    .webiny-pb-media-query--mobile-landscape &,
    .webiny-pb-media-query--mobile-portrait & {
        padding: 20px;
        text-align: center;
    }
`;

export const RightPanel = styled.div`
    // Let's write some responsive code using media classes
    .webiny-pb-media-query--mobile-landscape &,
    .webiny-pb-media-query--mobile-portrait & {
        padding: 20px;
    }
`;

export const Logo = styled.div`
    display: flex;
    margin-bottom: 25px;

    & img {
        max-width: 150px;
    }

    // Let's write some responsive code using media classes
    .webiny-pb-media-query--mobile-landscape &,
    .webiny-pb-media-query--mobile-portrait & {
        justify-content: center;
    }
`;

export const WebsiteDescription = styled.p`
    margin-bottom: 12px;
    color: var(--webiny-theme-color-background);
`;

export const Links = styled.div`
    display: flex;
    margin-bottom: 12px;

    & a {
        color: var(--webiny-theme-color-background) !important;
        font-size: 14px;
        margin-right: 4px;

        &::after {
            content: "/";
            margin-left: 4px;
        }
    }

    // Let's write some responsive code using media classes
    .webiny-pb-media-query--mobile-landscape &,
    .webiny-pb-media-query--mobile-portrait & {
        justify-content: center;
    }
`;

export const WebsiteCopyRight = styled.p`
    color: var(--webiny-theme-color-background);
    margin-bottom: 12px;
`;
