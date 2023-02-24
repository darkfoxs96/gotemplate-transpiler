import {eq} from './eq';
import {call} from './call';
import {ne} from './ne';
import {lt} from './lt';
import {le} from './le';
import {ge} from './ge';
import {gt} from './gt';
import {len} from './len';
import {index} from './index-fn';
import {slice} from './slice';
import {or} from './or';
import {and} from './and';
import {not} from './not';
import {print} from './print';
import {println} from './println';
import {printf} from './printf';

export const functions = {
    eq,
    ne,
    lt,
    le,
    gt,
    ge,
    call,
    len,
    index,
    slice,
    or,
    and,
    not,
    print,
    println,
    printf,
    html: (...args: any[]) => args?.join(' ') || '', // TODO?
    js: (...args: any[]) => args?.join(' ') || '', // TODO?
    urlquery: (...args: any[]) => args?.join(' ') || '', // TODO?
};
