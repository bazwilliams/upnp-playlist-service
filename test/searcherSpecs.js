"use strict";
/* jshint -W024 */
/* jshint -W079 */
/* jshint expr:true */

const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require("sinon-chai");
const expect = chai.expect;
chai.use(sinonChai);

const _ = require('underscore');

const Searcher = require('../server/searcher');

describe('Searcher', () => {
    let sut;
    beforeEach(() => {
        let data = require('./data/textArray');
        sut = new Searcher(data);
    });
    describe('when searching data for specific result', () => {
        let results;
        beforeEach(() => {
            results = sut.search('Campervan Driving', 1);
        });
        it('Should return correct top result', () => {
            expect(results[0]).to.be.eql('Campervan Driving');
        });
    });
    describe('when searching data for close result', () => {
        let results;
        beforeEach(() => {
            results = sut.search('Camper Fan Drive', 1);
        });
        it('Should return correct top result', () => {
            expect(results[0]).to.be.eql('Campervan Driving');
        });
    });
    describe('when searching data for misspelled results', () => {
        let results;
        beforeEach(() => {
            results = sut.search('Favorites', 1);
        });
        it('Should return correct top result', () => {
            expect(results[0]).to.be.eql('Favourites');
        });
    });
    describe('when searching data using different casing', () => {
        let results;
        beforeEach(() => {
            results = sut.search('rOcK', 1);
        });
        it('Should return correct top result', () => {
            expect(results[0]).to.be.eql('Rock');
        });
    });
    describe('when searching data for shorted version', () => {
        let results;
        beforeEach(() => {
            results = sut.search('Rock', 1);
        });
        it('Should return correct top result', () => {
            expect(results[0]).to.be.eql('Rock');
        });
    });
    describe('when searching data for longer version', () => {
        let results;
        beforeEach(() => {
            results = sut.search('Rockin', 1);
        });
        it('Should return correct top result', () => {
            expect(results[0]).to.be.eql('Rocking');
        });
    });
    describe('when searching data for result known to be missing', () => {
        let results;
        beforeEach(() => {
            results = sut.search('Barb', 1);
        });
        it('Should return correct top result', () => {
            expect(results).to.be.empty;
        });
    });
});