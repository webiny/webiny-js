import * as React from "react";
import { Link } from "@webiny/react-router";
import { ReactComponent as FacebookIcon } from "./assets/facebook-square-brands.svg";
import { ReactComponent as TwitterIcon } from "./assets/twitter-square-brands.svg";
import { ReactComponent as InstagramIcon } from "./assets/instagram-brands.svg";
import styled from "@emotion/styled";
import { breakpoints, colors, typography } from "../../../theme";
import { usePage } from "@webiny/app-page-builder-elements";

export const Footer: React.FC = () => {
    const { layoutProps } = usePage();
    const { name, logo, social } = layoutProps["settings"];

    return (
        <FooterWrapper data-testid={"pb-footer"}>
            <FooterBody>
                <FooterLogo className={"logo"}>
                    <Link to="/">{logo && logo.src && <img src={logo.src} alt={name} />}</Link>
                    <div className={"copy"}>
                        {name} © {new Date().getFullYear()}
                    </div>
                </FooterLogo>
                {social && (
                    <FooterSocial className={"social"}>
                        {social.facebook && (
                            <a href={social.facebook}>
                                <FacebookIcon />
                            </a>
                        )}
                        {social.twitter && (
                            <a href={social.twitter}>
                                <TwitterIcon />
                            </a>
                        )}
                        {social.instagram && (
                            <a href={social.instagram}>
                                <InstagramIcon />
                            </a>
                        )}
                    </FooterSocial>
                )}
            </FooterBody>
        </FooterWrapper>
    );
};

const FooterWrapper = styled.footer`
    background-color: ${colors.color5};
    height: 100px;
`;

const FooterBody = styled.div`
    align-items: center;
    display: flex;
    flex-direction: row;
    height: 100%;
    justify-content: space-between;
    margin: 0 auto;
    max-width: 1200px;

    ${breakpoints.tablet} {
        flex-direction: column;
    }
`;

const FooterLogo = styled.div`
    align-items: center;
    display: flex;
    flex: 1;

    a {
        line-height: 80%;
    }

    img {
        margin-right: 10px;
        max-height: 25px;
    }

    .copy {
        ${typography.paragraph2}
        color: ${colors.color4}
    }
`;

const FooterSocial = styled.div`
    text-align: right;

    ${breakpoints.tablet} {
        margin-bottom: 15px;
    }

    a {
        display: inline-block;

        svg {
            height: 25px;
            margin-left: 10px;
            opacity: 0.6;
            transition: opacity 0.3s;
            color: ${colors.color4};

            &:hover {
                opacity: 1;
            }
        }
    }
`;
