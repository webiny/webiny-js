import { dynamicZoneField } from "./dynamicZoneField";
import { dynamicZoneFieldStorage } from "./dynamicZoneStorage";

export const createDynamicZoneField = () => {
    return [dynamicZoneField, dynamicZoneFieldStorage];
};
