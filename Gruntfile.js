module.exports = function(grunt) {
	grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-mocha-test');
    grunt.loadNpmTasks('grunt-mocha-istanbul');
	grunt.initConfig({
    	pkg: grunt.file.readJSON('package.json'),
	    watch: {
		  scripts: {
		    files: ['**/*.js', '**/*.json', '**/*.jade', '**/*.css'],
		    tasks: ['mochaTest'],
		    options: {
		      spawn: true,
		    },
		  },
		},
        mochaTest: {
            test: {
                options: {
                    reporter: 'spec',
                    quiet: false,
                    clearRequireCache: false
                },
                src: ['test/**/*.js']
            }
        },
        mocha_istanbul: {
            coverage: {
                src: 'test', // a folder works nicely
                options: {
                    reportFormats: ['text'],
                    mask: '*Specs.js'
                }
            }
        }
  	});
	grunt.registerTask('default', ['mochaTest']);
    grunt.registerTask('test', ['mochaTest']);
    grunt.registerTask('coverage', ['mocha_istanbul']);
};