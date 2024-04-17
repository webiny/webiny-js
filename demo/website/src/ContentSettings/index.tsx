import React, { useCallback, useContext, useEffect, useState } from "react";
import { ContentLanguage, ContentRegion, Translation } from "@demo/shared";
import { useRouter } from "@webiny/react-router";
import { useContentRegions } from "./useContentRegions";
import { LoadingSkeleton } from "../LoadingSkeleton";

interface ContentSettingsProps {
    children: React.ReactNode;
}

interface Company {
    name: string;
    logo: string;
}

interface ContentSettingsContext extends ContentState {
    company: Company;
    regions: ContentRegion[];
    currentRegion: ContentRegion;
    currentLanguage: ContentLanguage;
    getLink: (slug: string) => string;
    setTranslations: (translations: Translation[]) => void;
}

const ContentSettingsContext = React.createContext<ContentSettingsContext | undefined>(undefined);

export interface ContentState {
    slug: string;
    regionPrefix: string;
    currentRegion?: ContentRegion;
    currentLanguage?: ContentLanguage;
    translations: Translation[];
}

export const ContentSettings = ({ children }: ContentSettingsProps) => {
    const { location, history } = useRouter();
    const { company, regions, loading } = useContentRegions();
    const [state, setState] = useState<ContentState>({
        currentLanguage: undefined,
        currentRegion: undefined,
        slug: "",
        translations: [],
        regionPrefix: ""
    });

    const getLink = useCallback(
        (slug: string) => {
            if (!state.currentRegion || !state.currentLanguage) {
                return slug;
            }

            const regionPrefix = `/${state.currentRegion.slug}-${state.currentLanguage.slug}`;

            return `${regionPrefix}${slug}`;
        },
        [state.currentLanguage?.slug, state.currentRegion?.slug]
    );

    useEffect(() => {
        const defaultRegion = regions[0];
        if (!defaultRegion) {
            return;
        }

        if (location.pathname !== "/") {
            const [regionSlug, langSlug] = location.pathname.slice(1).split("/")[0].split("-");
            const region = regions.find(region => region.slug === regionSlug);
            if (!region) {
                history.push("/");
                return;
            }

            const language = region!.languages.find(lang => lang.slug === langSlug);

            const regionPrefix = region && language ? `/${region.slug}-${language.slug}` : "";
            const slug = location.pathname.replace(regionPrefix, "") || "/";

            setState(state => ({
                ...state,
                slug,
                regionPrefix,
                currentRegion: region,
                currentLanguage: language
            }));
        } else {
            history.push(`/${defaultRegion.slug}-${defaultRegion.languages[0].slug}`);
        }
    }, [regions, location.pathname]);

    const setTranslations = useCallback((translations: Translation[]) => {
        setState(state => ({
            ...state,
            translations
        }));
    }, []);

    const context = {
        ...state,
        company: company!,
        regions,
        currentRegion: state.currentRegion!,
        currentLanguage: state.currentLanguage!,
        getLink,
        setTranslations
    };

    return (
        <ContentSettingsContext.Provider value={context}>
            {loading ? <LoadingSkeleton /> : children}
        </ContentSettingsContext.Provider>
    );
};

export const useContentSettings = () => {
    const context = useContext(ContentSettingsContext);
    if (!context) {
        throw Error("Missing ContentSettingsContext!");
    }

    return context;
};

export const useContentSlug = () => {
    const { slug, regionPrefix } = useContentSettings();
    return { slug, regionPrefix };
};
