import {PipelineBuilder} from './pipeline-builder';

const varResultName = 'r';
const varRootDataName = '__rd';
const varLocalDataName = '__ld';
const varFnsName = '__fs';
const varTmpName = '__tmp';
const varLocalTmpName = '__ltmp';

interface IMakeByLogicBlocksResult {
    newResult: string;
    newIndex: number;
}

export class GoHtmlTranspiler {
    private increment = 0;
    private localTemplates: Record<string, string> = {};

    constructor(
        private gohtml: string,
    ) {
    }

    public run(): string {
        this.localTemplates = {};

        let result = `(() => (${varRootDataName}, ${varFnsName}, ${varTmpName}) => {
    const ${varLocalDataName} = ${varRootDataName};
    const ${varLocalTmpName} = { ...${varTmpName} };
    let ${varResultName} = '';\n`;

        const matchLogicBlocks = Array.from(this.gohtml.matchAll(/\{\{[^}]*}}/g));
        const countLeftSpace = 0;

        if (!matchLogicBlocks[0]) {
            result += `${this.makeTabs(countLeftSpace)}${varResultName} += \`${this.gohtml}\`;\n`;
        } else {
            const { newResult } = this.makeByLogicBlocks(matchLogicBlocks, 0, countLeftSpace);
            for (let localTemplatesKey in this.localTemplates) {
                result += `${this.makeTabs(countLeftSpace)}${varLocalTmpName}["${localTemplatesKey}"] = ${this.localTemplates[localTemplatesKey]}\n`;
            }

            result += newResult;

            const last = matchLogicBlocks[matchLogicBlocks.length - 1];
            result += `${this.makeTabs(countLeftSpace)}${varResultName} += \`${this.gohtml.slice((last.index || 0) + last[0].length)}\`;\n`;
        }

        return result + `    return ${varResultName};
})();`;
    }

    private makeByLogicBlocks(matchLogicBlocks: RegExpMatchArray[], i: number, countLeftSpace: number): IMakeByLogicBlocksResult {
        let result = '';
        if (matchLogicBlocks[i - 1]) {
            result += this.makeStringPart(this.gohtml, matchLogicBlocks, i, countLeftSpace);
        } else {
            result += `${this.makeTabs(countLeftSpace)}${varResultName} += \`${this.gohtml.slice(0, matchLogicBlocks[i].index)}\`;\n`;
        }

        let startedBlock = false;
        let localI = 0;
        for (; i < matchLogicBlocks.length; i++, localI++) {
            const matchLogicBlock = matchLogicBlocks[i];
            const matchResult = matchLogicBlock[0];
            const { index } = matchLogicBlock;
            const logicCode = matchResult.slice(2, matchResult.length - 2).trim();

            if (
                localI > 0 &&
                (!(logicCode.startsWith('else if') || logicCode === 'else' || logicCode === 'end') || !startedBlock)
            ) {
                result += this.makeStringPart(this.gohtml, matchLogicBlocks, i, countLeftSpace);
            }

            if (logicCode.startsWith('if')) {
                if (startedBlock) {
                    throw 'the "if" block cannot start until the other block is closed';
                }

                startedBlock = true;
                const pipelineSource = logicCode.slice(2).trim();
                const pipeline = new PipelineBuilder(
                    pipelineSource,
                    varLocalDataName,
                    varRootDataName,
                    varFnsName,
                ).run();

                result += `${this.makeTabs(countLeftSpace)}if (${pipeline}) {\n`;
                const r = this.makeByLogicBlocks(matchLogicBlocks, i + 1, countLeftSpace + 1);
                result += r.newResult;
                i = r.newIndex - 1;
                result += `${this.makeTabs(countLeftSpace)}}\n`;
            } else if (logicCode.startsWith('with')) {
                if (startedBlock) {
                    throw 'the "with" block cannot start until the other block is closed';
                }

                startedBlock = true;
                const varsAndPipelineSource = logicCode.slice(4).trim();
                const {
                    pipelineSource,
                    objVarName,
                } = this.parseVarsAndPipelineSource(varsAndPipelineSource);

                const pipeline = new PipelineBuilder(
                    pipelineSource,
                    varLocalDataName,
                    varRootDataName,
                    varFnsName,
                ).run();

                const pipeResultName = `__pr${this.getIncrement()}`;
                result += `${this.makeTabs(countLeftSpace)}const ${pipeResultName} = ${pipeline};\n`;
                result += `${this.makeTabs(countLeftSpace)}if (${pipeResultName}) {\n`;
                countLeftSpace++;
                result += `${this.makeTabs(countLeftSpace)}const ${varLocalDataName} = ${pipeResultName};\n`;
                if (objVarName) {
                    result += `${this.makeTabs(countLeftSpace)}const ${objVarName} = ${varLocalDataName};\n`;
                }
                const r = this.makeByLogicBlocks(matchLogicBlocks, i + 1, countLeftSpace);
                result += r.newResult;
                i = r.newIndex - 1;
                countLeftSpace--;
                result += `${this.makeTabs(countLeftSpace)}}\n`;
                //
            } else if (logicCode.startsWith('else if')) {
                if (!startedBlock) {
                    return {
                        newResult: result,
                        newIndex: i,
                    };
                }

                const pipelineSource = logicCode.slice(7).trim();
                const pipeline = new PipelineBuilder(
                    pipelineSource,
                    varLocalDataName,
                    varRootDataName,
                    varFnsName,
                ).run();
                result += `${this.makeTabs(countLeftSpace)}else if (${pipeline}) {\n`;
                const r = this.makeByLogicBlocks(matchLogicBlocks, i + 1, countLeftSpace + 1);
                result += r.newResult;
                i = r.newIndex - 1;
                result += `${this.makeTabs(countLeftSpace)}}\n`;
            } else if (logicCode === 'else') {
                if (!startedBlock) {
                    return {
                        newResult: result,
                        newIndex: i,
                    };
                }

                result += `${this.makeTabs(countLeftSpace)}else {\n`;
                const r = this.makeByLogicBlocks(matchLogicBlocks, i + 1, countLeftSpace + 1);
                result += r.newResult;
                i = r.newIndex - 1;
                result += `${this.makeTabs(countLeftSpace)}}\n`;
            } else if (logicCode === 'end') {
                if (!startedBlock) {
                    return {
                        newResult: result,
                        newIndex: i,
                    };
                }

                startedBlock = false;
            } else if (logicCode.startsWith('-') || logicCode.startsWith('/*')) { // comment
                // just skip
            } else if (logicCode.startsWith('range')) {
                if (startedBlock) {
                    throw 'the "range" block cannot start until the other block is closed';
                }

                startedBlock = true;
                const varsAndPipelineSource = logicCode.slice(5).trim();
                const {
                    pipelineSource,
                    indexVarName,
                    objVarName,
                } = this.parseVarsAndPipelineSource(varsAndPipelineSource);

                const pipeline = new PipelineBuilder(
                    pipelineSource,
                    varLocalDataName,
                    varRootDataName,
                    varFnsName,
                ).run();

                const pipeResultName = `__pr${this.getIncrement()}`;
                result += `${this.makeTabs(countLeftSpace)}const ${pipeResultName} = ${pipeline};\n`;
                result += `${this.makeTabs(countLeftSpace)}if (${pipeResultName} && ${pipeResultName}.length) {\n`;
                countLeftSpace++;
                result += `${this.makeTabs(countLeftSpace)}for (let i = 0; i < ${pipeResultName}.length; i++) {\n`;
                result += `${this.makeTabs(countLeftSpace + 1)}const ${varLocalDataName} = ${pipeResultName}[i];\n`;
                if (indexVarName) {
                    result += `${this.makeTabs(countLeftSpace + 1)}const ${indexVarName} = i;\n`;
                }
                if (objVarName) {
                    result += `${this.makeTabs(countLeftSpace + 1)}const ${objVarName} = ${varLocalDataName};\n`;
                }
                const r = this.makeByLogicBlocks(matchLogicBlocks, i + 1, countLeftSpace + 1);
                result += r.newResult;
                i = r.newIndex - 1;
                result += `${this.makeTabs(countLeftSpace)}}\n`;
                countLeftSpace--;
                result += `${this.makeTabs(countLeftSpace)}}\n`;
                //
            } else if (logicCode.startsWith('define')) {
                let newTmpName = logicCode.slice(6).trim();
                newTmpName = newTmpName.slice(1, newTmpName.length - 1);
                let opened = 1;

                for (let b = i + 1; b < matchLogicBlocks.length; b++) {
                    const subMatchLogicBlock = matchLogicBlocks[b];
                    const subMatchResult = subMatchLogicBlock[0];
                    const subLogicCode = subMatchResult.slice(2, subMatchResult.length - 2).trim();

                    if (
                        subLogicCode.startsWith('if') ||
                        subLogicCode.startsWith('range') ||
                        subLogicCode.startsWith('with') ||
                        subLogicCode.startsWith('define')
                    ) {
                        opened++;
                    } else if (subLogicCode === 'end') {
                        opened--;
                    }

                    if (opened === 0) {
                        this.localTemplates[newTmpName] = new GoHtmlTranspiler(
                            this.gohtml.slice((matchLogicBlock.index || 0) + matchLogicBlock[0].length, subMatchLogicBlock.index)
                        ).run();
                        i = b;
                        break;
                    }
                }
                //
            } else if (logicCode.startsWith('template')) {
                const tmpNamePipelineSource = logicCode.slice(8).trim();
                const index = tmpNamePipelineSource.indexOf('"', 1);
                const tmpName = tmpNamePipelineSource.slice(1, index);
                const pipelineSource = tmpNamePipelineSource.slice(index + 1).trim();

                let pipeline = '';
                if (pipelineSource) {
                    pipeline = new PipelineBuilder(
                        pipelineSource,
                        varLocalDataName,
                        varRootDataName,
                        varFnsName,
                    ).run();
                } else {
                    pipeline = 'undefined';
                }

                const varTemplateNames = this.localTemplates[tmpName] ? varLocalTmpName : varTmpName;
                result += `${this.makeTabs(countLeftSpace)}if (!${varLocalTmpName}["${tmpName}"]) {\n`;
                result += `${this.makeTabs(countLeftSpace + 1)}throw 'no template named ' + "${tmpName}" + ' was found!';\n`;
                result += `${this.makeTabs(countLeftSpace)}}\n`;
                result += `${this.makeTabs(countLeftSpace)}${varResultName} += ${varLocalTmpName}["${tmpName}"](${pipeline}, ${varFnsName}, ${varTemplateNames});\n`;
                //
            } else if (logicCode === 'block') {
                // TODO: block
                throw 'block is not supported now';
            } else if (logicCode === 'break') {
                result += `${this.makeTabs(countLeftSpace)}break;\n`;
            } else if (logicCode === 'continue') {
                result += `${this.makeTabs(countLeftSpace)}continue;\n`;
            } else if (logicCode[0] === '$' && logicCode.includes('=')) { // new variable
                const {
                    pipelineSource,
                    objVarName,
                } = this.parseVarsAndPipelineSource(logicCode);
                if (!objVarName) {
                    throw 'not found objVarName';
                }

                const pipeline = new PipelineBuilder(
                    pipelineSource,
                    varLocalDataName,
                    varRootDataName,
                    varFnsName,
                ).run();

                result += `${this.makeTabs(countLeftSpace)}const ${objVarName} = ${pipeline};\n`;
                //
            } else { // interpolate
                const pipeline = new PipelineBuilder(
                    logicCode,
                    varLocalDataName,
                    varRootDataName,
                    varFnsName,
                ).run();
                result += `${this.makeTabs(countLeftSpace)}${varResultName} += ${pipeline};\n`;
            }
        }

        return {
            newResult: result,
            newIndex: i,
        };
    }

    makeTabs(countLeftSpace: number): string {
        let r = '';

        for (let i = 0; i <= countLeftSpace; i++) {
            r += '    ';
        }

        return r;
    }

    private makeStringPart(gohtml: string, matchLogicBlocks: RegExpMatchArray[], i: number, countLeftSpace: number): string {
        const prev = matchLogicBlocks[i - 1];
        let slice = gohtml.slice((prev.index || 0) + prev[0].length, matchLogicBlocks[i].index);
        slice = slice.replaceAll('`', '\\`');
        return `${this.makeTabs(countLeftSpace)}${varResultName} += \`${slice}\`;\n`;
    }

    private getIncrement(): number {
        return ++this.increment;
    }

    private parseVarsAndPipelineSource(varsAndPipelineSource: string): VarsAndPipelineSource {
        let pipelineSource = '';
        let indexVarName = '';
        let objVarName = '';
        let splitterVarsAndPipeline = '';

        if (varsAndPipelineSource.includes(':=')) {
            splitterVarsAndPipeline = ':=';
        } else if (varsAndPipelineSource.includes('=')) {
            splitterVarsAndPipeline = '=';
        }
        if (splitterVarsAndPipeline) {
            const list = varsAndPipelineSource.split(splitterVarsAndPipeline);
            pipelineSource = list[1].trim();
            const varsNames = list[0].trim().split(',');
            if (varsNames.length > 1) {
                indexVarName = varsNames[0].trim();
                objVarName = varsNames[1].trim();
            } else {
                objVarName = varsNames[0].trim();
            }
        } else {
            pipelineSource = varsAndPipelineSource;
        }

        return {
            pipelineSource,
            indexVarName,
            objVarName,
        };
    }
}

export interface VarsAndPipelineSource {
    pipelineSource: string;
    indexVarName: string;
    objVarName: string;
}
