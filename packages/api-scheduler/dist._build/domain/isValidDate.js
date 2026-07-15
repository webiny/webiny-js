import { SCHEDULE_MIN_FUTURE_SECONDS } from "../constants.js";
const isValidDate = (input)=>{
    const minDate = new Date(Date.now() + 1000 * SCHEDULE_MIN_FUTURE_SECONDS);
    return input.getTime() >= minDate.getTime();
};
export { isValidDate };

//# sourceMappingURL=isValidDate.js.map