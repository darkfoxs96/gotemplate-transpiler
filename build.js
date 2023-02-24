require('esbuild').build({
    entryPoints: ['src/index.ts'],
    target: 'esnext'.split(','),
    platform: 'node',
    bundle: true,
    sourcemap: true,
    minify: true,
    treeShaking: true,
    outfile: 'dist/index.js',
});
