import {print} from './print';

export function println(...args: any[]): string {
    return print(...args) + '\n';
}
