/**
 * This is a class to unit test the functions in NLPConfig module
 *
 * Shamod Lacoul 08 Nov 2012
 *
 * Usage:
 * 	 `mocha` or `mocha -R spec` (in your command line to run the tests)
 */

// require package
var expect = require('chai').expect;

// import NLPConfig module	
var nlpconfig = require('../src/NLPConfig');

/**
 * test to check the Config functions
 */
describe('Config', function(){
 	var config;
  	
  	before(function(){
      config = new nlpconfig.NLPConfig.Config();
  	});

	describe('test if the config file returns name', function(){
	  it('expected to match the name', function(){
	  	expect(config.getConfig().stanfordnlp.name).to.equal('Stanford CoreNLP');
	  });
	});
});