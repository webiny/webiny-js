import React from "react";
import { PbRenderElementPlugin } from "./_dev";
import { SpaceX } from "./SpaceX";

export const Extension = () => <PbRenderElementPlugin elementType={"spaceX"} render={SpaceX} />;
