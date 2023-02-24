require('esbuild').build({
    entryPoints: ['test/test.ts'],
    target: 'esnext'.split(','),
    platform: 'node',
    bundle: true,
    sourcemap: true,
    outfile: 'dist/test.js',
    watch: true,
});
