import { createComponentPropsProvider } from "~/utils.js";
import { type CardProps } from "../Card.js";

const [CardPropsProvider, useCardProps] = createComponentPropsProvider<CardProps>();

export { CardPropsProvider, useCardProps };
