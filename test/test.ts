import {GoHtmlTranspiler} from '../src/gohtml-transpiler';
const fs = require('fs');
const path = require('path');

(async () => {
    // "some" | printf1 "%s" | printf2 "%s%s" "dom" | printf3 "%s
    //

    // {{printf (printf "%s") (printf "%s" "some") | printf (printf "%s")}}
    // .Some
    // printf "%s" "some" | printf printf "%s" "%s%s"

    // printf "%s" "some" | printf (printf "%s" "%s%s" "dom") | printf "%s"
    // printf

    // printf "%s" "some" | printf "%s%s" "dom" | printf "%s"
    // "some" | printf "%s" | printf "%s%s" "dom" | printf "%s"
    // printf "%s" (printf "%s%s" (printf "%s" "some") "dom")
    // printf "%s \" %s" .Obj.Text (printf (printf $user.Name $.Some) (printf `%s \`c` "some" printf `%s` "some2"))
    // const v = new PipelineBuilder(`"some" | printf1 "%s" | printf2 "%s%s" "dom" | printf3 "%s"`, '__ld', '__rd', '__fs')
    // const v = new PipelineBuilder(`printf "%s \\" %s" .Obj.Text (printf (printf \`%s \\\`c\` "some" printf \`%s\` "some2") (printf $user.Name $.Some))`, '__ld', '__rd', '__fs')
    //     .run()
    // const v = new PipelineBuilder(`eq $index 0`, '__ld', '__rd', '__fs')
    //     .run();
    // console.log(v);

    const gohtml: string = fs
        .readFileSync(path.resolve(__dirname, `../test/index.gohtml`), "utf8");

    const result = new GoHtmlTranspiler(gohtml)
        .run();

    fs.writeFileSync(path.resolve(__dirname, `../test/check.js`), result);

    // const tmp = eval(result);
    // const data = {
    //     Exist: true,
    //     Some: false,
    //     List: [
    //         {
    //             Id: 1,
    //             Name: 'Leo',
    //         },
    //         {
    //             Id: 2,
    //             Name: 'Den',
    //         },
    //     ],
    //     Obj: { Text: 'Hi' },
    // };
    //
    // const tmpResult = tmp(data, functions, {});
    // console.log(tmpResult);

})().catch(e => console.error(e));
