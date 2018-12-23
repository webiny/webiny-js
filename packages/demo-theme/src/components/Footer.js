//@flow
import * as React from "react";
import { getFooterData } from "./graphql";
import { Query } from "react-apollo";
import { get } from "lodash";

import { ReactComponent as FacebookIcon } from "./assets/facebook-square-brands.svg";
import { ReactComponent as TwitterIcon } from "./assets/twitter-square-brands.svg";
import { ReactComponent as InstagramIcon } from "./assets/instagram-brands.svg";

const Footer = () => {
    return (
        <Query query={getFooterData}>
            {({ data: response }) => {
                const { name, logo, social } = get(response, "settings.general") || {};

                return (
                    <div className={"webiny-cms-section-footer"}>
                        <div className="webiny-cms-section-footer__wrapper">
                            <div className={"webiny-cms-section-footer__logo"}>
                                <a href="/">{logo && <img src={logo.src} alt={name} />}</a>
                                <div
                                    className={
                                        "webiny-cms-section-footer__copy webiny-cms-typography-description"
                                    }
                                >
                                    {name} © {new Date().getFullYear()}
                                </div>
                            </div>
                            {social && (
                                <div className={"webiny-cms-section-footer__social"}>
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
                                </div>
                            )}
                        </div>
                    </div>
                );
            }}
        </Query>
    );
};

export { Footer };
