import { useEffect } from "react";
import { useContainer } from "@webiny/app";
import { createFeature } from "@webiny/feature/admin";

interface RegisterFeatureProps {
    feature: ReturnType<typeof createFeature>;
}

export const RegisterFeature = ({ feature }: RegisterFeatureProps) => {
    const container = useContainer();
    useEffect(() => {
        feature.register(container);
    }, []);
    return null;
};
