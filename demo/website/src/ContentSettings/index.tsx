import React, { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { ContentLanguage, ContentRegion } from "@demo/shared";
import { useRouter } from "@webiny/react-router";
import { useContentRegions } from "./useContentRegions";
import { LoadingContentSettings } from "./LoadingContentSettings";

interface ContentSettingsProps {
    children: React.ReactNode;
}

interface ContentSettingsContext {
    regions: Array<ContentRegion>;
    currentRegion: ContentRegion;
    currentLanguage: ContentLanguage;
    getLink: (slug: string) => string;
}

const ContentSettingsContext = React.createContext<ContentSettingsContext | undefined>(undefined);

export const ContentSettings = ({ children }: ContentSettingsProps) => {
    const { location, history } = useRouter();
    const { regions, loading } = useContentRegions();
    const [currentLanguage, setLanguage] = useState<ContentLanguage | undefined>();
    const [currentRegion, setRegion] = useState<ContentRegion | undefined>();

    const getLink = useCallback(
        (slug: string) => {
            if (!currentRegion || !currentLanguage) {
                return slug;
            }

            const regionPrefix = `/${currentRegion.slug}-${currentLanguage.slug}`;

            return `${regionPrefix}${slug}`;
        },
        [currentLanguage, currentRegion]
    );

    useEffect(() => {
        const defaultRegion = regions[0];
        if (!defaultRegion) {
            return;
        }

        if (location.pathname !== "/") {
            const [regionSlug, langSlug] = location.pathname.slice(1).split("/")[0].split("-");
            const region = regions.find(region => region.slug === regionSlug);
            const language = region!.languages.find(lang => lang.slug === langSlug);
            setRegion(region);
            setLanguage(language);
        } else {
            history.push(`/${defaultRegion.slug}-${defaultRegion.languages[0].slug}`);
        }
    }, [regions, location.pathname]);

    const context = useMemo(() => {
        return {
            regions,
            currentLanguage: currentLanguage!,
            currentRegion: currentRegion!,
            getLink
        };
    }, [regions, currentRegion, currentLanguage]);

    return (
        <ContentSettingsContext.Provider value={context}>
            {loading ? <LoadingContentSettings /> : children}
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
    const { currentRegion, currentLanguage } = useContentSettings();
    const { location } = useRouter();

    const regionPrefix = `/${currentRegion.slug}-${currentLanguage.slug}`;
    const slug = location.pathname.replace(regionPrefix, "");

    return { slug: slug || "/", regionPrefix };
};

export const useChangeRegion = () => {
    const { currentLanguage } = useContentSettings();
    const { history, location } = useRouter();
    const { regionPrefix } = useContentSlug();

    return (slug: string) => {
        history.push(location.pathname.replace(regionPrefix, `/${slug}-${currentLanguage.slug}`));
    };
};

export const useChangeLanguage = () => {
    const { currentRegion } = useContentSettings();
    const { history, location } = useRouter();
    const { regionPrefix } = useContentSlug();

    return (slug: string) => {
        history.push(location.pathname.replace(regionPrefix, `/${currentRegion.slug}-${slug}`));
    };
};
