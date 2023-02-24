export function and(...args: any[]): any {
    if (!args) {
        return;
    }

    for (let arg of args) {
        if (!arg) {
            return arg;
        }
    }

    return args[0];
}
