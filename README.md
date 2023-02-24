# gotemplate-transpiller
Makes it possible to convert Go Template to JavaScript code

## gotemplate-node
### Example
Go Template:
```gotemplate
{{if eq .Exist true}}
        <div class="d1">{{$.Obj.Text | printf "%s %s" "dom" | printf "%s" (printf "%s" 10 | printf "%s %s" true)}}</div>
{{else if .Some}}
    {{if eq .Obj.Text "Hi"}}
        <div class="d3">{{.Exist}} Hello2.2</div>
    {{end}}
{{end}}
```

Use:
```javascript
const { GoHtmlTranspiler, functions } = require("gotemplate-node/dist/index");

const result = new GoHtmlTranspiler(goTemplate).run();
```

Result JS:
```javascript
(() => (__rd, __fs, __tmp) => {
    const __ld = __rd;
    const __ltmp = { ...__tmp };
    let r = '';
    r += ``;
    if (__fs.eq(__ld.Exist, true)) {
        r += `
    <div class="d1">`;
        r += __fs.printf("%s", (__fs.printf("%s %s", true, (__fs.printf("%s", 10)))), (__fs.printf("%s %s", "dom", __rd.Obj.Text)));
        r += `</div>
`;
    }
    else if (__ld.Some) {
        r += `
    `;
        if (__fs.eq(__ld.Obj.Text, "Hi")) {
            r += `
        <div class="d3">`;
            r += __ld.Exist;
            r += ` Hello2.2</div>
    `;
        }
        r += `
`;
    }
    r += `
`;
    return r;
})();
```

Run:
```javascript
const templateFuction = eval(result);
const data = {
    Exist: true,
    Some: false,
    List: [
        {
            Id: 1,
            Name: 'Leo',
        },
        {
            Id: 2,
            Name: 'Den',
        },
    ],
    Obj: {
        Text: 'Hi',
    },
};

const renderResult = templateFuction(data, functions, {});
console.log(renderResult);
```
