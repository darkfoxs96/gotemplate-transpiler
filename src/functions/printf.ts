// @ts-ignore
import { sprintf } from 'printj/printj.mjs';
import { sprintf as tSprintf } from 'printj';

export function printf(format: string, ...args: any[]): string {
    return (sprintf as typeof tSprintf)(format, ...args);
}
