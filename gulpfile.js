'use strict';

var gulp = require('gulp'),
    tslint = require('gulp-tslint'),
    sourcemaps = require('gulp-sourcemaps'),
    uglify = require('gulp-uglify'),
    rename = require('gulp-rename'),
    clean = require('gulp-clean'),
    gulpts = require('gulp-typescript'),
    jasmine = require('gulp-jasmine'),
    reporters = require('jasmine-reporters'),
    istanbul = require('gulp-istanbul'),
    webserver = require('gulp-webserver'),
    replace = require('gulp-replace'),
    instanbulEnforcer = require('gulp-istanbul-enforcer'),
    typedoc = require('gulp-typedoc'),
    remap = require('remap-istanbul/lib/gulpRemapIstanbul'),
    rollup = require('rollup'),
    tsrollup = require('rollup-plugin-typescript'),
    rollupReplace = require('rollup-plugin-replace'),
    typescript = require('typescript'),
    pkg = require('./package.json'),
    dts = require('dts-bundle'),
    merge = require('merge2'),
    runSequence = require('run-sequence');

var src = ['src/**/*.ts'];
var stagingSrc = ['**/*.ts', '!node_modules/**/*.ts', '**/*.spec.ts', '!node_modules/**/*.spec.ts'];

var dest = 'dist';
var stagingOutput = 'build';
var coverageOutput = stagingOutput + '/coverage';
var coverageFile = coverageOutput + '/coverage-final.json';
var lcovFile = coverageOutput + '/lcov.info';

var tsProject = gulpts.createProject('tsconfig.json');
var tsStagingProject = gulpts.createProject('tsconfig-staging.json');

gulp.task('tslint', function () {
    return gulp.src(src)
        .pipe(tslint({ formatter: "verbose", configuration: "tslint.json" }))
        .pipe(tslint.report({ summarizeFailureOutput: true }));
});

gulp.task('clean', ['clean:staging'], function () {
    return gulp.src(dest, { read: false })
        .pipe(clean());
});

gulp.task('clean:staging', function () {
    return gulp.src('build', { read: false })
        .pipe(clean());
});

function createBundle(format, destination) {
    return rollup.rollup({
        input: 'src/desktop.ts',
        plugins: [
            tsrollup({ typescript: typescript }),
            rollupReplace({
                PACKAGE_VERSION: pkg.version
            })
        ]
    }).then(function (bundle) {
        return bundle.write({
            file: destination,
            format: format,
            name: pkg.title,
            moduleName: pkg.title,
            sourcemap: true
        });
    });
}

gulp.task('build:main', [], function () {
    // Main bundle is umd
    return createBundle('umd', pkg.main)
        .then(function () {
            // Generate iife for use as a V8 extension if necessary since umd isn't supported
            createBundle('iife', dest + '/iffe/desktop.js');
        }).then(function () {
            // Wrap umd with a condition checking if desktopJS is already defined to not overwrite it.  This will allow
            // preload registration of desktopJS without hosted web script includes redefining.
            gulp.src(pkg.main)
                .pipe(replace(/(\(function \(global, factory\)[\s\S]*}\)\)\);)([\s\S]*)/, "if (typeof desktopJS === \"undefined\") {$1}$2"))
                .pipe(clean())
                .pipe(gulp.dest(dest));
        });
});

gulp.task('build:staging', [], function () {
    var tsResult = gulp.src(stagingSrc)
        .pipe(sourcemaps.init())
        .pipe(tsStagingProject({
            typescript: typescript,
        }));

    return merge([
        tsResult.js
            .pipe(sourcemaps.write('.'))
            .pipe(gulp.dest(stagingOutput)),
        tsResult.dts
            .pipe(gulp.dest(stagingOutput))
    ]);;
});

gulp.task('test', ['build:staging'], function () {
    return gulp.src('build/src/**/*.js')
        .pipe(istanbul({ includeUntested: true }))
        .pipe(istanbul.hookRequire())
        .on('finish', function () {
            gulp.src(['build/tests/**/*.js', 'build/tests/**/*.spec.js'])
                .pipe(jasmine(
                    {
                        verbose: true,
                        errorOnFail: true,
                        includeStackTrace: false,
                        reporter: [
                            new reporters.JUnitXmlReporter({ savePath: stagingOutput }),
                            new reporters.TerminalReporter({ verbosity: 3, color: true, showStack: true })
                        ]
                     }))
                .pipe(istanbul.writeReports({
                    dir: coverageOutput,
                    reporters: ['json', 'cobertura']
                }))
                .on('end', remapCoverageFiles)
                .on('finish', function () {
                    gulp.src('.')
                        .pipe(instanbulEnforcer({
                            coverageDirectory: coverageOutput,
                            rootDirectory: '',
                            thresholds: {
                                statements: 80
                            }
                        }));
                });
        });
});

/**
 * Since the default export in umd bundle desktop.js has hierarchy we need to introduce modules into the .d.ts
 * to match this hierarchy before rolling up the declarations
 */
function injectModuleDeclarations(src) {
    return src.pipe(replace(/(\/\*\*[\s\S]*export declare class (\w+)Container[\s\S]*})/, "export module $2 {\n$1\n}"))
        .pipe(clean())
        .pipe(gulp.dest(stagingOutput + "/src"));
}

gulp.task('dts', [], function () {
    return injectModuleDeclarations(gulp.src(
        [
            stagingOutput + "/src/Default/default.d.ts",
            stagingOutput + "/src/Electron/electron.d.ts",
            stagingOutput + "/src/OpenFin/openfin.d.ts"
        ], { base: stagingOutput + "/src" }))
        .on('finish', function () {
            dts.bundle({
                name: pkg.name,
                main: stagingOutput + "/src/desktop.d.ts",
                out: "../../" + pkg.types,
                verbose: false,
                outputAsModuleFolder: true
            });
        });
});

gulp.task("docs", function () {
    return gulp
        .src(['src/**/**.ts'])
        .pipe(typedoc({
            mode: "modules",
            target: "ES6",
            module: "umd",
            includeDeclarations: true,
            excludeExternals: true,
            excludePrivate: true,
            out: "docs/",
            hideGenerator: true,
            ignoreCompilerErrors: true
        }))
        .on('end', function () {
            require('fs').writeFileSync('docs/.nojekyll', '');
        });
});

/** Take js coverage json and remap to typescript.  Output html and text */
function remapCoverageFiles() {
    return gulp.src(coverageFile)
        .pipe(remap({
            reports: {
                'json': coverageFile, // overwrite js based json with ts remapped version
                'html': coverageOutput,
                'lcovonly': lcovFile,
                'cobertura': coverageOutput + '/cobertura-coverage.xml',
                'text': null
            }
        }));
};

gulp.task('compress', [], function (cb) {
    return gulp.src(pkg.main)
        .pipe(sourcemaps.init({ loadMaps: true }))
        .pipe(uglify())
        .pipe(rename({ extname: '.min.js' }))
        .pipe(sourcemaps.write(''))
        .pipe(gulp.dest(dest));
});

gulp.task("server", [], function () {
    return gulp.src(['examples/web', dest])
        .pipe(webserver({
            fallback: 'index.html',
            livereload: {
                enable: true
            }
        }));
});

gulp.task('build', [], function() {
    return runSequence(['tslint', 'clean'], ['build:main', 'test'], ['dts', 'compress']);
});

gulp.task('watch', ['build', 'server'], function () {
    gulp.watch(['src/**/*.*', 'tests/**/*.*', '*.json', '*.js'], function() {
        return runSequence('tslint', ['build:main', 'test'], ['dts', 'compress']);
    });
});

gulp.task('bundle', ['build']);

gulp.task('default', ['bundle']);