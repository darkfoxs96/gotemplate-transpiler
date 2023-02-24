export function or(...args: any[]): any {
    if (!args) {
        return;
    }

    for (let arg of args) {
        if (arg) {
            return arg;
        }
    }

    return args[args.length - 1];
}
