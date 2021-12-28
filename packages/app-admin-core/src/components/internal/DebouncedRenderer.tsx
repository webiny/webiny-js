import { useEffect, useMemo, useState } from "react";
import debounce from "lodash.debounce";

/**
 * We need to debounce the rendering of children during app bootstrap, since many plugins
 * can add more and more Providers which will recompose the entire hierarchy of React Context providers.
 * During this stage, we don't want to render anything.
 */
export const DebouncedRenderer = ({ children }) => {
    const [render, setRender] = useState(false);

    const debouncedRender = useMemo(() => {
        return debounce(() => setRender(true), 50);
    }, [setRender]);

    useEffect(() => {
        debouncedRender();

        return () => {
            debouncedRender.cancel();
        };
    }, []);

    return render ? children : null;
};
