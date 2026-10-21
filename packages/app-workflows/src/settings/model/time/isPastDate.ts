// Whether `date` is a day before `today`; both `yyyy-MM-dd`, which compare as strings (R319).
export const isPastDate = (date: string, today: string): boolean => {
    return date < today;
};
