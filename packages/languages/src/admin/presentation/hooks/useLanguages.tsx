import { useEffect, useState } from "react";
import { autorun } from "mobx";
import { useFeature } from "@webiny/app";
import { ListLanguagesFeature } from "~/admin/features/listLanguages/index.js";
import type { LanguageDto } from "~/admin/features/listLanguages/index.js";

export const useLanguages = () => {
    const { useCase, repository } = useFeature(ListLanguagesFeature);
    const [languages, setLanguages] = useState<LanguageDto[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        useCase.execute().then(() => {
            setLoading(false);
        });

        return autorun(() => {
            const languages = repository.getLanguages();
            setLanguages(languages);
        });
    }, [useCase, repository]);

    return { loading, languages };
};
