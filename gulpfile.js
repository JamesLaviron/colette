const gulp = require('gulp')
const plumber = require('gulp-plumber')
const rename = require('gulp-rename')
const stylus = require('gulp-stylus')
const stylint = require('gulp-stylint')
const eslint = require('gulp-eslint')
const webpack = require('webpack')
const gulpWebpack = require('webpack-stream')
const svgstore = require('gulp-svgstore')
const fs = require('fs')
const jsdoc = require('gulp-jsdoc3')
const kss = require('kss')
const finalhandler = require('finalhandler')
const http = require('http')
const serveStatic = require('serve-static')
const named = require('vinyl-named')
const postcss = require('gulp-postcss')
const cssnano = require('cssnano')
const autoprefixer = require('autoprefixer')
const postcssFocusVisible = require('postcss-focus-visible')

const kssConfig = require('./kss.json')
const jsDocConfig = require('./jsdoc.json')

const cfg = {
  fontsDir: 'assets/fonts/',
  imgsDir: 'assets/img/',
  cssDir: 'assets/styl/',
  jsDir: 'assets/js/',
  svgDir: 'assets/svg/',
  kssBuilderDir: 'kss-builder/',
  docDir: 'docs/',
  distDir: 'dist/',
  stylusPattern: '**/*.styl',
  twigPattern: '**/*.twig',
  kssPattern: '**/*',
  jsPattern: '**/*.js',
  svgPattern: '**/*.svg',
}

function stylesBuild() {
  const dest = `${cfg.distDir}css`

  return gulp.src(`${cfg.cssDir}colette.styl`)
    .pipe(stylus({
      compress: false, // cssnano do it
      linenos: false,
      include: ['node_modules'],
      'include css': true,
    }))
    .pipe(postcss([
      postcssFocusVisible(),
      autoprefixer(),
    ]))
    .pipe(rename('colette.css'))
    .pipe(gulp.dest(dest))
    .pipe(postcss([
      cssnano({
        preset: ['default', {
          mergeRules: false, // mergeRules make :focus-visible buggy, keep it false
          minifyFontValues: {
            removeQuotes: false,
          },
        }],
      }),
    ]))
    .pipe(rename('colette.min.css'))
    .pipe(gulp.dest(dest))
}

function scriptsBuild() {
  return gulp.src(`${cfg.jsDir}colette.js`)
    .pipe(plumber())
    .pipe(named())
    .pipe(gulpWebpack({
      output: {
        filename: '[name].min.js',
        libraryTarget: 'umd',
      },
      mode: 'production',
      module: {
        rules: [{
          test: /(\.jsx|\.js|\.es6)$/,
          use: {
            loader: 'babel-loader',
            options: {
              babelrc: false,
              presets: [
                ['@babel/preset-env', {
                  useBuiltIns: 'entry',
                }],
              ],
              plugins: [
                ['@babel/plugin-transform-strict-mode', {
                  strict: true,
                }],
              ],
            },
          },
        }],
      },
      resolve: {
        modules: [
          'node_modules',
        ],
        extensions: ['.js', '.es6'],
      },
      devtool: 'source-map',
    }, webpack))
    .pipe(gulp.dest(`${cfg.distDir}js`))
}

function stylesLint() {
  return gulp.src(cfg.cssDir + cfg.stylusPattern)
    .pipe(stylint({ config: '.stylintrc' }))
    .pipe(stylint.reporter())
    .pipe(stylint.reporter('fail', { failOnWarning: true }))
}

function scriptsLint() {
  return gulp.src(cfg.jsDir + cfg.jsPattern)
    .pipe(plumber())
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failAfterError())
}

function fontsCopy() {
  // Retrieve fonts into dist/ directory
  return gulp.src(`${cfg.fontsDir}**/*`)
    .pipe(gulp.dest(`${cfg.distDir}fonts`))
}

function imgsCopy() {
  // Retrieve images into dist/ directory
  return gulp.src(`${cfg.imgsDir}**/*`)
    .pipe(gulp.dest(`${cfg.distDir}img`))
}

function svgBuild() {
  return gulp
    .src(cfg.svgDir + cfg.svgPattern, { base: cfg.svgDir })
    .pipe(rename((filePath) => {
      const name = filePath.dirname !== '.' ? filePath.dirname.split(filePath.sep) : []
      name.push(filePath.basename)
      filePath.basename = `symbol-${name.join('-')}`
    }))
    .pipe(svgstore({ inlineSvg: true }))
    .pipe(gulp.dest(`${cfg.distDir}svg/`))
}

function kssBuild(done) {
  // we need the dist/ folder to build docs/
  // so we check if it exists and throw an error if needed
  if (!fs.existsSync(cfg.distDir)) {
    console.log('Can’t access the dist/ folder.')
    console.log('Try running `gulp build` to solve the problem.')

    return
  }

  // generate doc
  kss(kssConfig).then(() => {
    // retrieve dist directory
    gulp.src(`${cfg.distDir}*/**`)
      .pipe(gulp.dest(`${cfg.docDir}dist/`))

    done()
  })
}

function jsDoc(cb) {
  gulp.src(['./assets/js/README.md', './assets/js/**/*.js'], { read: false })
    .pipe(jsdoc(jsDocConfig, cb))
}

function watch() {
  gulp.watch(cfg.cssDir + cfg.twigPattern, gulp.series('kss'))
  gulp.watch(cfg.cssDir + cfg.stylusPattern, gulp.series(gulp.parallel('lint:css', 'styles'), 'kss'))
  gulp.watch(cfg.svgDir + cfg.svgPattern, gulp.series('svg', 'kss'))
  gulp.watch(cfg.jsDir + cfg.jsPattern, gulp.series(gulp.parallel('lint:js', 'scripts'), 'kss'))
}

function startServer(done) {
  const serve = serveStatic('docs')

  const server = http.createServer((req, res) => {
    serve(req, res, finalhandler(req, res))
  })

  server.listen(8000)

  done()
}

gulp.task('connect', startServer)

// lint
gulp.task('lint:css', stylesLint)
gulp.task('lint:js', scriptsLint)
gulp.task('lint', gulp.series('lint:js', 'lint:css'))

// build css
gulp.task('styles', stylesBuild)

// js
gulp.task('scripts', scriptsBuild)

// assets
gulp.task('assets:fonts', fontsCopy)
gulp.task('assets:imgs', imgsCopy)
gulp.task('assets', gulp.parallel('assets:fonts', 'assets:imgs'))

// kss
gulp.task('kss', kssBuild)

// jsDoc
gulp.task('jsDoc', jsDoc)

// svg
gulp.task('svg', svgBuild)

// watch
gulp.task('watch', watch)

// build
gulp.task('build', gulp.parallel('svg', 'styles', 'scripts', 'assets'))

// build docs
gulp.task('docs', gulp.series('build', 'kss', 'jsDoc'))

// default build docs and run watch
gulp.task('default', gulp.series('connect', 'lint', 'docs', 'watch'))
