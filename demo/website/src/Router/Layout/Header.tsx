import React, { useCallback } from "react";
import { useContentSettings } from "../../ContentSettings";
import { Link, useRouter } from "@webiny/react-router";
import { Profile } from "./Profile";

export const Header = () => {
    const { history } = useRouter();
    const { regions, currentRegion, currentLanguage, translations, company } = useContentSettings();

    const getTranslatedPath = (basePath: string, languageId: string) => {
        const translation = translations.find(t => t.languageId === languageId);
        if (!translation) {
            return basePath;
        }

        return [basePath, translation.articleSlug].join("");
    };

    const goToPathname: React.ChangeEventHandler<HTMLSelectElement> = useCallback(e => {
        history.push(e.target.value);
    }, []);

    return (
        <>
            <header className="antialiased">
                <nav className="bg-gray-50 dark:bg-gray-900 fixed w-full z-20 top-0 start-0 p-3 border border-gray-300">
                    <div className="flex flex-wrap justify-between items-center">
                        <div className="flex justify-start items-center">
                            <Link to="/" className="flex mr-4">
                                <img src={company.logo} className="mr-3 h-8" alt={company.name} />
                            </Link>
                        </div>

                        <div className="flex items-center lg:order-2">
                            <form className="max-w-sm mx-auto">
                                <div className="flex">
                                    <label className="sr-only">Choose a region</label>
                                    <select
                                        id="states"
                                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm border border-gray-300 rounded-s-lg dark:border-s-gray-700 focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                        onChange={goToPathname}
                                        value={`/${currentRegion.slug}-${currentRegion.languages[0].slug}`}
                                    >
                                        {regions.map(region => {
                                            return (
                                                <option
                                                    key={region.id}
                                                    value={`/${region.slug}-${region.languages[0].slug}`}
                                                >
                                                    {region.title}
                                                </option>
                                            );
                                        })}
                                    </select>

                                    <label className="sr-only">Choose a language</label>
                                    <select
                                        id="states"
                                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-e-lg border-s-gray-100 dark:border-s-gray-700 border-s-2 focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                        onChange={goToPathname}
                                        value={getTranslatedPath(
                                            `/${currentRegion.slug}-${currentLanguage.slug}`,
                                            currentLanguage.id
                                        )}
                                    >
                                        {currentRegion.languages.map(lang => {
                                            return (
                                                <option
                                                    key={lang.id}
                                                    value={getTranslatedPath(
                                                        `/${currentRegion.slug}-${lang.slug}`,
                                                        lang.id
                                                    )}
                                                >
                                                    {lang.name}
                                                </option>
                                            );
                                        })}
                                    </select>
                                </div>
                            </form>

                            <Profile />
                        </div>
                    </div>
                </nav>
            </header>
        </>
    );
};
