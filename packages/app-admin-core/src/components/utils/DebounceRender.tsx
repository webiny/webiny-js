import { useEffect, useMemo, useState } from "react";
import debounce from "lodash.debounce";

/**
 * We need to debounce the rendering of children during app bootstrap, since many plugins
 * can add more and more Providers which will recompose the entire hierarchy of React Context providers.
 * During this stage, we don't want to render anything.
 */
export const DebounceRender = ({ wait = 50, children }) => {
    const [render, setRender] = useState(wait === 0);

    const debouncedRender = useMemo(() => {
        return debounce(() => {
            setRender(true);
        }, wait);
    }, [setRender]);

    useEffect(() => {
        if (render) {
            return null;
        }

        debouncedRender();

        return () => {
            debouncedRender.cancel();
        };
    }, []);

    return render ? children : null;
};
