var chai = require('chai');
var mockery = require('mockery');
var sinon = require('sinon');
var sinonChai = require("sinon-chai");
var expect = chai.expect;
chai.use(sinonChai);

describe('Ds', function () {
    var ds, upnpMock, soapRequestCb, responseParserMock, soapObject;
    beforeEach(function () {
        upnpMock = {
            soapRequest: function (deviceUrlRoot, path, service, fnName, fnParams, callback) {
                soapRequestCb = callback;
                return {
                    on: function () {}
                }
            }
        };
        responseParserMock = {
            xml: function (parser, callback) {
                parser(soapObject, callback);
            }
        };
        mockery.enable({
            warnOnUnregistered: false
        });
        mockery.registerMock('./lib/upnp.js', upnpMock);
        mockery.registerMock('./responseparsers.js', responseParserMock);
        
        var Ds = require('../server/ds.js').Ds;
        ds = new Ds('/test', {
            'urn:av-openhome-org:service:Info:1' : '/control',
            'urn:av-openhome-org:service:Radio:1' : '/control'
        });
    });
    afterEach(function () {
        mockery.deregisterAll();
        mockery.disable();
    });
    describe('When getting list of radio stations', function () {
        var radioStations;
        beforeEach(function (done) {
            soapObject = { 
                's:Envelope': { 
                    's:Body' : { 
                        'u:ReadListResponse' : {
                            'ChannelList' : '<ChannelList><Entry><Id>23</Id><Metadata>&lt;DIDL-Lite xmlns:dc=&quot;http://purl.org/dc/elements/1.1/&quot; xmlns:upnp=&quot;urn:schemas-upnp-org:metadata-1-0/upnp/&quot; xmlns=&quot;urn:schemas-upnp-org:metadata-1-0/DIDL-Lite/&quot;&gt;&lt;item id=&quot;&quot; parentID=&quot;&quot; restricted=&quot;True&quot;&gt;&lt;dc:title&gt;BBC Radio 6 Music (AAA)&lt;/dc:title&gt;&lt;res protocolInfo=&quot;*:*:*:*&quot; bitrate=&quot;40000&quot;&gt;http://opml.radiotime.com/Tune.ashx?id=s44491&amp;amp;formats=mp3,wma,aac,wmvideo,ogg,hls&amp;amp;partnerId=ah2rjr68&amp;amp;username=bazwilliams&amp;amp;c=ebrowse&lt;/res&gt;&lt;upnp:albumArtURI&gt;http://cdn-radiotime-logos.tunein.com/s44491g.png&lt;/upnp:albumArtURI&gt;&lt;upnp:class&gt;object.item.audioItem&lt;/upnp:class&gt;&lt;/item&gt;&lt;/DIDL-Lite&gt;</Metadata></Entry></ChannelList>'
                        }
                    }
                }
            };
            ds.retrieveRadioStationDetails('23 34', function (err, data) {
                radioStations = data;
                done();
            });
            soapRequestCb({
                setEncoding: sinon.spy()
            });
        });
        it('Radio station list should be an array with 1 item', function () {
            expect(radioStations).to.be.an('array').and.have.length(1);
        });
        it('Radio station list Id to be 23', function () {
            expect(radioStations[0].id).to.be.eql('23');
        });
        it('Radio station list uri to be correct', function () {
            expect(radioStations[0].uri).to.be.eql('http://opml.radiotime.com/Tune.ashx?id=s44491&formats=mp3,wma,aac,wmvideo,ogg,hls&partnerId=ah2rjr68&username=bazwilliams&c=ebrowse');
        });
        it('Radio station list title to be BBC Radio 6 Music (AAA)', function () {
            expect(radioStations[0].title).to.be.eql('BBC Radio 6 Music (AAA)');
        });
        it('Radio station list artwork to be correct', function () {
            expect(radioStations[0].artwork).to.be.eql('http://cdn-radiotime-logos.tunein.com/s44491g.png');
        });
    });
    describe('When getting current track details', function() {
        var trackDetails;
        beforeEach(function (done) {
            soapObject = { 
                's:Envelope': { 
                    's:Body' : { 
                        'u:TrackResponse' : {
                            Uri: 'http://track/test',
                            Metadata: 'Metadata'
                        }
                    }
                }
            };
            ds.currentTrackDetails(function (err, data) {
                trackDetails = data;
                done();
            });
            soapRequestCb({
                setEncoding: sinon.spy()
            });
        });
        it('Track should be correct', function () {
            expect(trackDetails.track).to.be.eql('http://track/test');
        });
        it('Metadata should be correct', function () {
            expect(trackDetails.metadata).to.be.eql('Metadata');
        });
    });
});