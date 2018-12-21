//@flow
import * as React from "react";
import { getFooterData } from "./graphql";
import { Query } from "react-apollo";
import { get } from "lodash";

const Footer = () => {
    return (
        <Query query={getFooterData}>
            {({ data: response }) => {
                const { name, logo, social } = get(response, "settings.general") || {};

                return (
                    <div className={"webiny-cms-section-footer"}>
                        <div className="webiny-cms-section-footer__wrapper">
                            <div className={"webiny-cms-section-footer__logo"}>
                                <a href="/">{logo && <img src={logo.src} alt={name} />}</a> {name}{" "}
                                (c) 2018
                            </div>
                            {social && (
                                <div className={"webiny-cms-section-footer__social"}>
                                    <a href={social.facebook}>Facebook</a>
                                    <a href={social.instagram}>Instagram</a>
                                    <a href={social.twitter}>Twitter</a>
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
