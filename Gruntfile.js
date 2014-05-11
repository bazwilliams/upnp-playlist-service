module.exports = function(grunt) {
	grunt.loadNpmTasks('grunt-contrib-nodeunit');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.initConfig({
	    watch: {
		  scripts: {
		    files: ['**/*.js', '**/*.json', '**/*.jade', '**/*.css'],
		    tasks: ['nodeunit'],
		    options: {
		      spawn: false,
		    },
		  },
		},  
		nodeunit: {
    		all: ['test/**/test-*.js']
  		}
  	});
	grunt.registerTask('default', ['nodeunit']);
};
