import { Chance } from "chance";

const chanceInstance = new Chance();

export const chance = () => {
    return chanceInstance;
};
