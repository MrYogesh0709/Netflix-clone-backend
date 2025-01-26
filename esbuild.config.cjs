// esbuild.config.js
const esbuild = require('esbuild');

const isWatch = process.argv.includes('--watch');

const config = {
  entryPoints: ['src/index.ts'],
  bundle: true,
  platform: 'node',
  target: ['node20'],
  outfile: 'dist/index.js',
  sourcemap: true,
  watch: isWatch
    ? {
        onRebuild(error) {
          if (error) console.error('Rebuild failed:', error);
          else console.log('Rebuilt successfully');
        },
      }
    : false,
};

async function build() {
  try {
    if (isWatch) {
      const ctx = await esbuild.context(config);
      await ctx.watch();
    } else {
      await esbuild.build(config);
    }
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

build();
