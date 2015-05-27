module.exports = function(grunt) {
	grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-mocha-test');
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
        }
  	});
	grunt.registerTask('default', ['mochaTest']);
};
