import React from "react";
import { BuilderController } from "./BuilderController";
import { BuilderPresenter } from "./BuilderPresenter";
import { builderRepository } from "./BuilderRepository";
import { Builder, BuilderProps } from "./Builder";

const controller = new BuilderController(builderRepository);
const presenter = new BuilderPresenter(builderRepository);

export const BuilderCompositionRoot = (props: Omit<BuilderProps, "presenter" | "controller">) => {
    return <Builder {...props} controller={controller} presenter={presenter} />;
};
