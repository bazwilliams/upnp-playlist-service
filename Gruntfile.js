module.exports = function(grunt) {
	grunt.loadNpmTasks('grunt-node-mocha');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.initConfig({
    	pkg: grunt.file.readJSON('package.json'),
	    watch: {
		  scripts: {
		    files: ['**/*.js', '**/*.json', '**/*.jade', '**/*.css'],
		    tasks: ['node_mocha'],
		    options: {
		      spawn: false,
		    },
		  },
		},  
		node_mocha: {
            with_coverage: {
                src : ['test'],
                options : {
                    mochaOptions : {
                        globals : ['expect'],
                        timeout : 3000,
                        ignoreLeaks : false,
                        ui : 'bdd',
                        reporter : 'spec'                        
                    },
                    reportFormats : ['html'], // other grunt-mocha-istanbul can be added here
                    runCoverage : true // Run the unit test and generate coverage test
                }
            }
  		}
  	});
	grunt.registerTask('default', ['node_mocha']);
};
