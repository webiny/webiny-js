import { useEffect, useState } from "react";
import { autorun } from "mobx";
import { LocalStorageFeature } from "~/features/localStorage/index.js";
import { useFeature } from "~/shared/di/useFeature.js";

export function useLocalStorageValue<T = string>(key: string): T | undefined {
    const { localStorageService } = useFeature(LocalStorageFeature);

    const [value, setValue] = useState<T | undefined>(() => localStorageService.get<T>(key));

    useEffect(() => {
        const dispose = autorun(() => {
            const value = localStorageService.get<T>(key);
            setValue(value);
        });
        return () => dispose();
    }, [localStorageService, key]);

    return value;
}
