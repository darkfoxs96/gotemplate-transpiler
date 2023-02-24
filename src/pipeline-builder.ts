export class PipelineBuilder {
    constructor(
        private pipeline: string,
        private localVar: string,
        private rootVar: string,
        private fnsVar: string,
    ) {
    }

    public run(): string {
        let argList = this.pipelineArgBuilder(this.pipeline);
        argList = this.rewriteCallForPipelineArg(argList);
        // console.log(JSON.stringify(argList, null, 2));
        return this.buildPipeline(argList, 0, false).newResult;
    }

    private rewriteCallForPipelineArg(argList: PipelineArg[]): PipelineArg[] {
        let result: PipelineArg[] = [...argList];

        for (let i = 0; i < result.length; i++) {
            const arg = result[i];
            if (arg.type === ArgTypeEnum.SelectedBlock) {
                arg.value = this.rewriteCallForPipelineArg(arg.value as PipelineArg[]);
                continue;
            }
            if (arg.type !== ArgTypeEnum.Call) {
                continue;
            }

            if (!result[i - 1]) {
                throw `there must be an argument before '|'`;
            } else if (!result[i + 1]) {
                throw `after '|' there should be a function and not a void`;
            } else if (result[i + 1].type !== ArgTypeEnum.Function) {
                throw `after '|' there should be a function`;
            }

            const fnArg = result[i + 1];
            let arg2: PipelineArg;
            let arg2From: number;
            const arg2To = i;
            for (let b = i - 1; b >= 0; b--) {
                const searchArg = result[b];

                if (b === 0 && searchArg.type !== ArgTypeEnum.Function) {
                    arg2 = result[i - 1];
                    arg2From = i - 1;
                } else if (searchArg.type === ArgTypeEnum.Function) {
                    arg2From = b;
                    arg2 = new PipelineArg(
                        ArgTypeEnum.SelectedBlock,
                        result.slice(arg2From, arg2To),
                    );
                }
            }
            // @ts-ignore
            if (!arg2 || arg2From === undefined) {
                throw `no argument found for '|'`;
            }

            let insertBefore: number;
            let insertToEnd = false;
            for (let b = i + 2; b < result.length; b++) {
                const searchArg = result[b];

                if (searchArg.type === ArgTypeEnum.Function) {
                    throw `there should be no regular function call after '|'. Use '|' again or highlight the block with parentheses`;
                } else if (searchArg.type === ArgTypeEnum.Call) {
                    insertBefore = b;
                    break;
                } else if (b === result.length - 1) {
                    insertBefore = result.length;
                    insertToEnd = true;
                    break;
                }
            }
            // @ts-ignore
            if (insertBefore === undefined) {
                throw `not found insertBefore`;
            }

            if (insertToEnd) {
                const deleteCount = (arg2To - arg2From) + 1;
                result.splice(arg2From, deleteCount);
                result.push(arg2);
            } else {
                const deleteCount = (arg2To - arg2From) + 2;
                result.splice(arg2From, deleteCount);

                result = [
                    fnArg,
                    ...result.slice(0, insertBefore - deleteCount),
                    arg2,
                    ...result.slice(insertBefore - deleteCount),
                ];
            }

            i = 0;
        }

        return result;
    }

    private buildPipeline(argList: PipelineArg[], i: number, argsForFunction?: boolean): IMakePipelineResult {
        let result = '';
        let localI = 0;

        for (; i < argList.length; i++, localI++) {
            const arg = argList[i];

            if (argsForFunction && localI > 0) {
                result += ', ';
            }

            if (arg.type === ArgTypeEnum.Function) {
                result += `${this.fnsVar}.${arg.value}(`;

                const r = this.buildPipeline(argList, i + 1, true);
                result += r.newResult;
                result += `)`;
                break;
            } else if (arg.type === ArgTypeEnum.LocalVar) {
                result += (arg.value === '' ? this.localVar : `${this.localVar}.${arg.value}`);
            } else if (arg.type === ArgTypeEnum.RootVar) {
                result += (arg.value === '' ? this.rootVar : `${this.rootVar}.${arg.value}`);
            } else if (arg.type === ArgTypeEnum.CustomVar) {
                result += arg.value;
            } else if (arg.type === ArgTypeEnum.StringA) {
                result += '`' + arg.value + '`';
            } else if (arg.type === ArgTypeEnum.StringQ) {
                result += '"' + arg.value + '"';
            } else if (arg.type === ArgTypeEnum.Boolean) {
                result += arg.value;
            } else if (arg.type === ArgTypeEnum.Number) {
                result += arg.value;
            } else if (arg.type === ArgTypeEnum.SelectedBlock) {
                result += `(`;

                const r = this.buildPipeline(arg.value as PipelineArg[], 0, true);
                result += r.newResult;
                result += `)`;
            }
        }

        return {
            newResult: result,
        };
    }

    private pipelineArgBuilder(source: string): PipelineArg[] {
        const result: PipelineArg[] = [];

        for (let i = 0; i < source.length; i++) {
            const symbol = source[i];

            if (symbol === '(') {
                const startI = i;
                let opened = 1;

                for (let blockI = startI + 1; blockI < source.length; blockI++) {
                    const blockSymbol = source[blockI];

                    if (blockSymbol === ')') {
                        opened--;

                        if (opened === 0) {
                            result.push(new PipelineArg(
                                ArgTypeEnum.SelectedBlock,
                                this.pipelineArgBuilder(source.slice(startI + 1, blockI)),
                            ));
                            i = blockI;
                            break;
                        }
                    } else if (blockSymbol === '(') {
                        opened++;
                    }
                }
            } else if (symbol === ')') {
                throw `you cannot close a block without opening it: ${source}`;
            } else if ((symbol === 't' && source.slice(i, i + 4) === 'true') || (symbol === 'f' && source.slice(i, i + 5) === 'false')) {
                result.push(new PipelineArg(
                    ArgTypeEnum.Boolean,
                    symbol === 't' ? 'true' : 'false',
                ));
                i += symbol === 't' ? 3 : 4;
            } else if (/[0-9]/.test(symbol)) {
                const startI = i;
                if (startI + 1 >= source.length) {
                    result.push(new PipelineArg(
                        ArgTypeEnum.Number,
                        symbol,
                    ));
                    continue;
                }

                for (let blockI = startI + 1; blockI < source.length; blockI++) {
                    const blockSymbol = source[blockI];

                    if (!/[0-9]/.test(blockSymbol) || blockI === source.length - 1) {
                        result.push(new PipelineArg(
                            ArgTypeEnum.Number,
                            source.slice(startI, blockI + (blockI === source.length - 1 ? 1 : 0)),
                        ));
                        i = blockI;
                        break;
                    }
                }
            } else if (symbol === '"' || symbol === '`') {
                const startI = i;

                for (let blockI = startI + 1; blockI < source.length; blockI++) {
                    const blockSymbol = source[blockI];

                    if (blockSymbol === symbol && source[blockI - 1] !== '\\') {
                        result.push(new PipelineArg(
                            symbol === '"' ? ArgTypeEnum.StringQ : ArgTypeEnum.StringA,
                            source.slice(startI + 1, blockI),
                        ));
                        i = blockI;
                        break;
                    }
                }
            } else if (symbol === '|') {
                result.push(new PipelineArg(
                    ArgTypeEnum.Call,
                    '|',
                ));
            } else if (symbol === '.') {
                const startI = i;
                if (startI + 1 >= source.length) {
                    result.push(new PipelineArg(
                        ArgTypeEnum.LocalVar,
                        '',
                    ));
                    continue;
                }

                for (let blockI = startI + 1; blockI < source.length; blockI++) {
                    const blockSymbol = source[blockI];

                    if (blockSymbol === ' ' || blockSymbol === ')' || blockI === source.length - 1) {
                        result.push(new PipelineArg(
                            ArgTypeEnum.LocalVar,
                            source.slice(startI + 1, blockI + (blockI === source.length - 1 ? 1 : 0)),
                        ));
                        i = blockI;
                        break;
                    }
                }
            } else if (symbol === '$' && /[0-9a-zA-Z]/.test(source[i + 1]) && source[i + 1]) {
                const startI = i;
                if (startI + 2 >= source.length) {
                    result.push(new PipelineArg(
                        ArgTypeEnum.CustomVar,
                        source.slice(startI, startI + 2),
                    ));
                    continue;
                }

                for (let blockI = startI + 2; blockI < source.length; blockI++) {
                    const blockSymbol = source[blockI];

                    if (blockSymbol === ' ' || blockSymbol === ')' || blockI === source.length - 1) {
                        result.push(new PipelineArg(
                            ArgTypeEnum.CustomVar,
                            source.slice(startI, blockI + (blockI === source.length - 1 ? 1 : 0)),
                        ));
                        i = blockI;
                        break;
                    }
                }
            } else if (symbol === '$') {
                const startI = i;
                if (startI + 1 >= source.length) {
                    result.push(new PipelineArg(
                        ArgTypeEnum.RootVar,
                        '',
                    ));
                    continue;
                }

                for (let blockI = startI + 1; blockI < source.length; blockI++) {
                    const blockSymbol = source[blockI];

                    if (blockSymbol === ' ' || blockSymbol === ')' || blockI === source.length - 1) {
                        result.push(new PipelineArg(
                            ArgTypeEnum.RootVar,
                            source.slice(startI + 2, blockI + (blockI === source.length - 1 ? 1 : 0)),
                        ));
                        i = blockI;
                        break;
                    }
                }
            } else if (/[0-9a-zA-Z]/.test(symbol)) {
                const startI = i;

                for (let blockI = startI + 1; blockI < source.length; blockI++) {
                    const blockSymbol = source[blockI];

                    if (blockSymbol === ' ' || blockSymbol === ')' || blockI === source.length - 1) {
                        result.push(new PipelineArg(
                            ArgTypeEnum.Function,
                            source.slice(startI, blockI + (blockI === source.length - 1 ? 1 : 0)),
                        ));
                        i = blockI;
                        break;
                    }
                }
            }
            //
        }

        return result;
    }
}

export class PipelineArg {
    constructor(
        type: ArgTypeEnum,
        value: string,
    )
    constructor(
        type: ArgTypeEnum.SelectedBlock,
        value: PipelineArg[],
    )
    constructor(
        public type: ArgTypeEnum,
        public value: string | PipelineArg[],
    ) {
    }

    getJsCode() {
    }
}

export enum ArgTypeEnum {
    Number, // 101
    Boolean, // true, false
    StringQ, // "text \" some"
    StringA, // `text " some\' text`
    Function, // printf
    Call, // |, "arg2" | printf "arg1 %s%s" "arg3" | printf "%s"
    CustomVar, // $user.Name, $index
    RootVar, // $.Users, $., $ , $}}, $(, $), $|, $', $"
    LocalVar, // .Name, .LastName
    SelectedBlock, // (), printf "%s" ((printf "%s" "some") ("code" | printf "%s"))
}

interface IMakePipelineResult {
    newResult: string;
}
