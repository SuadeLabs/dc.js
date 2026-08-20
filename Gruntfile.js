module.exports = function (grunt) {
    'use strict';

    require('load-grunt-tasks')(grunt, {
        pattern: ['grunt-*']
    });
    require('time-grunt')(grunt);

    grunt.loadNpmTasks('grunt-karma');

    const pkgFile =  require('./package.json');
    const pkgName = pkgFile.name.split('/')[1];

    const config = {
        src: 'src',
        spec: 'spec',
        web: 'web',
        websrc: 'web-src',
        dist: 'dist',
        pkg: pkgFile,
        pkgName: pkgName || pkgFile.name,
        banner: grunt.file.read('./LICENSE_BANNER')
    };

    // in d3v4 and d3v5 pre-built d3.js are in different sub folders
    const d3pkgSubDir = config.pkg.dependencies.d3.split('.')[0].replace(/[^\d]/g, '') === '4' ? 'build' : 'dist';

    const lintableFiles = `'${config.src}' '${config.spec}' '*.js' '<%= conf.websrc %>/stock.js'`;

    grunt.initConfig({
        conf: config,

        cssmin: {
            options: {
                shorthandCompacting: false,
                roundingPrecision: -1
            },
            main: {
                files: {
                    '<%= conf.dist %>/style/<%= conf.pkgName %>.min.css': ['<%= conf.dist %>/style/<%= conf.pkgName %>.css']
                }
            }
        },
        watch: {
            jsdoc2md: {
                files: ['docs/welcome.base.md', '<%= conf.src %>/**/*.js'],
                tasks: ['build', 'jsdoc', 'jsdoc2md']
            },
            scripts: {
                files: ['<%= conf.src %>/**/*.js', '<%= conf.web %>/stock.js'],
                tasks: ['docs']
            },
            websrc: {
                files: ['<%= conf.websrc %>/**/*.html', '<%= conf.websrc %>/**/*.js'],
                tasks: ['docs']
            },
            sass: {
                files: ['style/<%= conf.pkgName %>.scss'],
                tasks: ['sass', 'cssmin:main', 'copy:dc-to-gh']
            },
            tests: {
                files: [
                    '<%= conf.src %>/**/*.js',
                    '<%= conf.spec %>/*.js',
                    '<%= conf.spec %>/helpers/*.js',
                    '<%= conf.websrc %>/**/*',
                    'docs/**/*'],
                tasks: ['test']
            },
            reload: {
                files: ['<%= conf.dist %>/<%= conf.pkgName %>.js',
                        '<%= conf.dist %>/style/<%= conf.pkgName %>.css',
                        '<%= conf.web %>/js/<%= conf.pkgName %>.js',
                        '<%= conf.web %>/css/<%= conf.pkgName %>.css',
                        '<%= conf.dist %>/<%= conf.pkgName %>.min.js'],
                options: {
                    livereload: true
                }
            }
        },
        connect: {
            server: {
                options: {
                    port: process.env.PORT || 8888,
                    base: '.'
                }
            }
        },
        jasmine: {
            specs: {
                options: {
                    display: 'short',
                    summary: true,
                    specs:  '<%= conf.spec %>/*-spec.js',
                    helpers: [
                        '<%= conf.spec %>/helpers/*.js',
                        '<%= conf.spec %>/3rd-party/*.js'
                    ],
                    styles: [
                        '<%= conf.dist %>/style/dc.css'
                    ],
                    outfile: '<%= conf.spec %>/index.html',
                    keepRunner: true
                },
                src: [
                    '<%= conf.dist %>/<%= conf.pkgName %>.js'
                ]
            }
        },
        karma: {
            options: {
                configFile: 'karma.conf.js'
            },
            unit: {},
            coverage: {
                reporters: ['progress', 'coverage'],

                preprocessors: {
                    // source files, that you wanna generate coverage for
                    // do not include tests or libraries
                    // (these files will be instrumented by Istanbul)
                    '<%= conf.dist %>/<%= conf.pkgName %>.js': ['coverage']
                },

                // optionally, configure the reporter
                coverageReporter: {
                    type: 'html',
                    dir: 'coverage/'
                }
            },
            ci: {
                browsers: ['ChromeNoSandboxHeadless', 'FirefoxHeadless'],
                concurrency: 1,
                reporters: ['dots', 'summary']
            },
            'ci-windows': {
                browsers: ['EdgeHeadless', 'ChromeNoSandboxHeadless', 'FirefoxHeadless'],
                concurrency: 1,
                reporters: ['dots', 'summary']
            },
            'ci-macos': {
                browsers: ['Safari', 'ChromeNoSandboxHeadless', 'FirefoxHeadless'],
                concurrency: 1,
                reporters: ['dots', 'summary']
            },
        },
        jsdoc: {
            dist: {
                src: ['docs/welcome.base.md', '<%= conf.src %>/**/*.js', '!<%= conf.src %>/{banner,footer}.js'],
                options: {
                    destination: '<%= conf.web %>/docs/html',
                    template: 'node_modules/ink-docstrap/template',
                    configure: 'jsdoc.conf.json'
                }
            }
        },
        jsdoc2md: {
            dist: {
                src: '<%= conf.dist %>/<%= conf.pkgName %>.js',
                dest: 'docs/api-latest.md'
            }
        },
        // grunt-docco2 is deprecated https://www.npmjs.com/package/grunt-docco2 either fork and fix issues or look for new plugin
        // docco: {
        //     options: {
        //         dst: '<%= conf.web %>/docs'
        //     },
        //     howto: {
        //         files: [
        //             {
        //                 expand: true,
        //                 cwd: '<%= conf.web %>',
        //                 src: ['stock.js']
        //             }
        //         ]
        //     }
        // },
        copy: {
            'dc-to-gh': {
                files: [
                    {
                        expand: true,
                        nonull: true,
                        cwd: '<%= conf.websrc %>',
                        src: '**',
                        dest: '<%= conf.web %>/'
                    },
                    {
                        expand: true,
                        cwd: 'docs/old-api-docs',
                        src: '**',
                        dest: '<%= conf.web %>/docs/'
                    },
                    {
                        expand: true,
                        flatten: true,
                        nonull: true,
                        src: ['<%= conf.dist %>/style/<%= conf.pkgName %>.css', '<%= conf.dist %>/style/<%= conf.pkgName %>.min.css'],
                        dest: '<%= conf.web %>/css/'
                    },
                    {
                        expand: true,
                        flatten: true,
                        nonull: true,
                        src: [
                            '<%= conf.dist %>/<%= conf.pkgName %>.js',
                            '<%= conf.dist %>/<%= conf.pkgName %>.js.map',
                            '<%= conf.dist %>/<%= conf.pkgName %>.min.js',
                            '<%= conf.dist %>/<%= conf.pkgName %>.min.js.map',
                            `node_modules/d3/${d3pkgSubDir}/d3.js`,
                            'node_modules/crossfilter2/crossfilter.js',
                            'node_modules/file-saver/dist/FileSaver.js',
                            'node_modules/reductio/reductio.js',
                            'node_modules/regression/dist/regression.js'
                        ],
                        dest: '<%= conf.web %>/js/'
                    }
                ]
            },
            'specs': {
                files: [
                    {
                        expand: true,
                        flatten: true,
                        nonull: true,
                        src: [
                            `node_modules/d3/${d3pkgSubDir}/d3.js`,
                            'node_modules/crossfilter2/crossfilter.js',
                        ],
                        dest: '<%= conf.spec %>/3rd-party/'
                    },
                    {
                        expand: true,
                        flatten: true,
                        nonull: true,
                        src: [
                            'node_modules/compare-versions/index.js'
                        ],
                        dest: '<%= conf.spec %>/3rd-party/',
                        rename: function (dest, src) {
                            return `${dest}compare-versions.js`;
                        }
                    }
                ]
            }
        },
        'gh-pages': {
            options: {
                base: '<%= conf.web %>',
                message: 'Synced from from master branch.'
            },
            src: ['**']
        },
        shell: {
            merge: {
                command: function (pr) {
                    return [
                        'git fetch origin',
                        'git checkout master',
                        'git reset --hard origin/master',
                        'git fetch origin',
                        `git merge --no-ff origin/pr/${pr} -m 'Merge pull request #${pr}'`
                    ].join('&&');
                },
                options: {
                    stdout: true,
                    failOnError: true
                }
            },
            amend: {
                command: 'git commit -a --amend --no-edit',
                options: {
                    stdout: true,
                    failOnError: true
                }
            },
            hooks: {
                command: 'cp -n scripts/pre-commit.sh .git/hooks/pre-commit' +
                    ' || echo \'Cowardly refusing to overwrite your existing git pre-commit hook.\''
            },
            hierarchy: {
                command: 'dot -Tsvg -o <%= conf.websrc %>/img/class-hierarchy.svg class-hierarchy.dot'
            },
            'dist-clean': {
                command: 'rm -rf dist/'
            },
            rollup: {
                command: 'rollup --config'
            },
            eslint: {
                command: `eslint ${lintableFiles}`
            },
            'eslint-fix': {
                command: `eslint ${lintableFiles} --fix`
            }
        }
    });

    grunt.registerTask('merge', 'Merge a github pull request.', pr => {
        grunt.log.writeln(`Merge Github Pull Request #${pr}`);
        grunt.task.run([`shell:merge:${pr}`, 'test' , 'shell:amend']);
    });
    grunt.registerTask(
        'test-stock-example',
        'Test a new rendering of the stock example web page against a baseline rendering',
        function (option) {
            require('./regression/stock-regression-test.js').testStockExample(this.async(), option === 'diff');
        });
    grunt.registerTask('update-stock-example', 'Update the baseline stock example web page.', function () {
        require('./regression/stock-regression-test.js').updateStockExample(this.async());
    });
    grunt.registerTask('sass', 'Compile SCSS to CSS using the modern Dart Sass JS API', () => {
        // Calling the modern `sass.compile` API directly (rather than going through the
        // grunt-sass plugin) avoids grunt-sass's legacy/modern implementation auto-detection,
        // which throws "options.implementation.compileAsync is not a function" against
        // current Dart Sass releases now that the legacy render/renderSync API is removed.
        const sass = require('sass');
        const src = `style/${config.pkgName}.scss`;
        const destFile = `${config.dist}/style/${config.pkgName}.css`;
        const mapFile = `${destFile}.map`;

        const result = sass.compile(src, {
            style: 'expanded',
            sourceMap: true,
            sourceMapIncludeSources: true
        });

        let css = result.css;
        if (result.sourceMap) {
            result.sourceMap.file = `${config.pkgName}.css`;
            css += `\n/*# sourceMappingURL=${config.pkgName}.css.map */\n`;
            grunt.file.write(mapFile, JSON.stringify(result.sourceMap));
        }
        grunt.file.write(destFile, css);
        grunt.log.ok(`File ${destFile} created.`);
    });

    grunt.registerTask('watch:scripts-sass-docs', () => {
        grunt.config('watch', {
            scripts: grunt.config('watch').scripts,
            websrc: grunt.config('watch').websrc,
            sass: grunt.config('watch').sass
        });
        grunt.task.run('watch');
    });

    // task aliases
    grunt.registerTask('build', ['shell:dist-clean', 'shell:rollup', 'sass', 'cssmin']);
    // grunt-docco2 is deprecated https://www.npmjs.com/package/grunt-docco2 either fork and fix issues or look for new plugin
    // grunt.registerTask('docs', ['build', 'copy', 'jsdoc', 'jsdoc2md', 'docco']);
    grunt.registerTask('docs', ['build', 'copy', 'jsdoc', 'jsdoc2md']);
    grunt.registerTask('web', ['docs', 'gh-pages']);
    grunt.registerTask('server-only', ['docs', 'jasmine:specs:build', 'connect:server']);
    grunt.registerTask('server', ['server-only', 'watch:scripts-sass-docs']);
    // This task will active server, test when initiated, and then keep a watch for changes, and rebuild and test as needed
    grunt.registerTask('test-n-serve', ['server-only', 'test', 'watch:tests']);
    grunt.registerTask('test', ['build', 'copy', 'karma:unit']);
    grunt.registerTask('coverage', ['build', 'copy', 'karma:coverage']);
    grunt.registerTask('ci-pull', ['build', 'copy', 'karma:ci']);
    grunt.registerTask('ci-windows', ['build', 'copy', 'karma:ci-windows']);
    grunt.registerTask('ci-macos', ['build', 'copy', 'karma:ci-macos']);
    grunt.registerTask('lint', ['shell:eslint']);
    grunt.registerTask('lint-fix', ['shell:eslint-fix']);
    grunt.registerTask('default', ['build', 'shell:hooks']);
    grunt.registerTask('doc-debug', ['build', 'jsdoc', 'jsdoc2md', 'watch:jsdoc2md']);
};
