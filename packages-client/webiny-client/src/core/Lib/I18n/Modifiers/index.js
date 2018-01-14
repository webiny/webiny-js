// Built-in modifiers
import CountModifiers from './CountModifier';
import GenderModifier from './GenderModifier';
import IfModifier from './IfModifier';
import PluralModifier from './PluralModifier';
import DateModifier from './DateModifier';
import DateTimeModifier from './DateTimeModifier';
import TimeModifier from './TimeModifier';
import NumberModifier from './NumberModifier';
import PriceModifier from './PriceModifier';

export default [
    new CountModifiers(),
    new GenderModifier(),
    new IfModifier(),
    new PluralModifier(),
    new DateModifier(),
    new DateTimeModifier(),
    new TimeModifier(),
    new NumberModifier(),
    new PriceModifier()
];