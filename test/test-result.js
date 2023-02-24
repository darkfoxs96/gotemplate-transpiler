const d = (() => (__rd, __fs, __tmp) => {
    const __ld = __rd;
    const __ltmp = { ...__tmp };
    let r = '';
    __ltmp["some_tmp"] = (() => (__rd, __fs, __tmp) => {
        const __ld = __rd;
        const __ltmp = { ...__tmp };
        let r = '';
        r += `
    `;
        if (!__ltmp["some_tmp2"]) {
            throw 'no template named ' + "some_tmp2" + ' was found!';
        }
        r += __ltmp["some_tmp2"](__ld, __fs, __tmp);
        r += `!
`;
        return r;
    })();
    __ltmp["some_tmp2"] = (() => (__rd, __fs, __tmp) => {
        const __ld = __rd;
        const __ltmp = { ...__tmp };
        let r = '';
        r += `T12 `;
        r += __ld;
        r += ``;
        return r;
    })();
    r += ``;
    r += `
`;
    r += `

<div class="s1"></div>
`;
    r += `
<div class="s2">
    `;
    if (__fs.eq(__ld.Exist, true)) {
        r += `
        <div class="d1">`;
        r += __fs.printf("$s", (__fs.printf("%s%s", true, (__fs.printf("$s", 10)))), (__fs.printf("%s%s", "dom", __rd.Obj.Text)));
        r += `</div>
        <div class="d2">`;
        r += __fs.printf("%s", __ld.Exist);
        r += ` Hello1.1</div>
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
        <div class="d4">Hello2</div>
    `;
    }
    else {
        r += `
        <div class="d5">Hello3</div>
    `;
    }
    r += `

    `;
    const __pr1 = __fs.printf("%s%s", "dom", __rd.Obj.Text);
    if (__pr1) {
        const __ld = __pr1;
        r += `
        <div class="r1">`;
        r += __ld;
        r += `</div>
    `;
    }
    r += `

    `;
    const __pr2 = __ld.Exist;
    if (__pr2) {
        const __ld = __pr2;
        const $exist = __ld;
        r += `
        <div class="r2.1">`;
        r += $exist;
        r += `</div>
    `;
    }
    else {
        r += `
        <div class="r2.2">Exist is FALSE</div>
    `;
    }
    r += `

    <div class="s3">Comment divider</div>

    <div class="s4">
        Comment divider2 `;
    if (!__ltmp["some_tmp"]) {
        throw 'no template named ' + "some_tmp" + ' was found!';
    }
    r += __ltmp["some_tmp"](__ld.Exist, __fs, __ltmp);
    r += `
    </div>

    `;
    if (__ld.Exist) {
        r += `
        <div class="d6">Exist</div>
    `;
    }
    r += `

    `;
    const __pr3 = __ld.List;
    if (__pr3 && __pr3.length) {
        for (let i = 0; i < __pr3.length; i++) {
            const __ld = __pr3[i];
            const $index = i;
            const $user = __ld;
            r += `
        `;
            if (__fs.eq($index, 0)) {
                r += `
            <div class="d7">Index zero: `;
                r += $user.Id;
                r += ` - `;
                r += __ld.Name;
                r += `</div>
        `;
            }
            else if (__fs.eq($index, 2)) {
                r += `
            `;
                continue;
                r += `
        `;
            }
            else {
                r += `
            <div class="d7">Index `;
                r += $index;
                r += `: `;
                r += $user.Id;
                r += ` - `;
                r += __ld.Name;
                r += `</div>
        `;
            }
            r += `
    `;
        }
    }
    else {
        r += `
        <div class="d7">No users</div>
    `;
    }
    r += `


</div>
`;
    return r;
})();

const fMap = {
    printf(format, ...args) {
        return format + ' ' + (args?.join(' ') || '');
    },
    eq(arg1, arg2) {
        return arg1 === arg2;
    },
}

const data = {
    Exist: false,
    Some: true,
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
    Obj: { Text: 'Hi' },
};

console.log(d(data, fMap, {}));
// const start = new Date();
// let r = '';
// console.log('START');
// for (let i = 0; i < 1_000_000; i++) {
//     data.List[0].Id++;
//     r = d(data, fMap, {});
// }
// console.log('END', ((new Date().getTime() - start.getTime()) / 1000) + 's');
