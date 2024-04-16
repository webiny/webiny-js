import React from "react";
import styled from "@emotion/styled";
import { useContentSettings } from "../../ContentSettings";
import { Link } from "@webiny/react-router";

const HeaderContainer = styled.div`
    padding: 10px;
    border-bottom: 1px solid gray;
    display: flex;
    > div {
        margin: 0 20px;
    }
`;

export const Header = () => {
    const { regions, currentRegion, currentLanguage, translations } = useContentSettings();

    const getTranslatedPath = (basePath: string, languageId: string) => {
        const translation = translations.find(t => t.languageId === languageId);
        if (!translation) {
            return basePath;
        }

        return [basePath, translation.articleSlug].join("");
    };

    return (
        <HeaderContainer>
            <div>
                <h4>Regions</h4>
                <ul>
                    {regions.map(region => {
                        const activeRegion = region.id === currentRegion.id;
                        return (
                            <li key={region.id}>
                                <Link to={`/${region.slug}-${region.languages[0].slug}`}>
                                    {activeRegion ? "> " : null}
                                    {region.title}
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </div>
            <div>
                <h4>Languages</h4>
                <ul>
                    {currentRegion.languages.map(lang => {
                        const activeLang = lang.id === currentLanguage.id;
                        return (
                            <li key={lang.id}>
                                <Link
                                    to={getTranslatedPath(
                                        `/${currentRegion.slug}-${lang.slug}`,
                                        lang.id
                                    )}
                                >
                                    {activeLang ? "> " : null}
                                    {lang.name}
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </div>
        </HeaderContainer>
    );
};
