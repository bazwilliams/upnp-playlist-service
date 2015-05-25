var chai = require('chai');
var mockery = require('mockery');
var sinon = require('sinon');
var sinonChai = require("sinon-chai");
var expect = chai.expect;
chai.use(sinonChai);

describe('Ds', function () {
    var ds, upnpMock, soapRequestCb, responseParserMock, soapObject, soapRequestArgs;
    beforeEach(function () {
        soapObject = void 0;
        soapRequestArgs = {};
        soapRequestCb = void 0;
        upnpMock = {
            soapRequest: function (deviceUrlRoot, path, service, fnName, fnParams, callback) {
                soapRequestArgs = arguments;
                soapRequestCb = callback;
                return {
                    on: function () {}
                }
            }
        };
        responseParserMock = {
            xml: function (parser, callback) {
                return function (res) {
                    parser(soapObject, callback);
                }
            }
        };
        mockery.enable({
            warnOnUnregistered: false
        });
        mockery.registerMock('./lib/upnp.js', upnpMock);
        mockery.registerMock('./responseparsers.js', responseParserMock);
        
        var Ds = require('../server/ds.js').Ds;
        ds = new Ds('/test', {
            'urn:av-openhome-org:service:Info:1' : { controlUrl: '/control' },
            'urn:av-openhome-org:service:Radio:1' : { controlUrl: '/radio' },
            'urn:av-openhome-org:service:Product:1' : { controlUrl: '/product' },
            'urn:av-openhome-org:service:Playlist:1' : { controlUrl: '/playlist' },
            'urn:av-openhome-org:service:Volume:1' : { controlUrl: '/volume' }
        });
    });
    afterEach(function () {
        mockery.deregisterAll();
        mockery.disable();
    });
    describe('When getting track id list of radio stations', function () {
        var trackIds;
        beforeEach(function (done) {
            soapObject = { 
                's:Envelope': { 
                    's:Body' : { 
                        'u:IdArrayResponse' : {
                            'Token' : 4,
                            'Array' : 'AAAAFwAAABgAAAAZAAAAGgAAABsAAAAcAAAAHQAAAB4AAAAfAAAAIAAAACEAAAAiAAAAIwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=='
                        }
                    }
                }
            };
            ds.getRadioIdArray(function (err, data) {
                trackIds = data;
                done();
            });
            soapRequestCb({
                statusCode: 200,
                setEncoding: sinon.spy()
            });
        });
        it('Should use the radio control uri', function () {
            expect(soapRequestArgs[1]).to.be.eql('/radio');
        });
        it('Radio station list should be an array with 13 item', function () {
            expect(trackIds).to.be.an('array').and.have.length(13);
        });
        it('Radio station list should contain the correct station ids', function () {
            expect(trackIds).to.eql([23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35]);
        });
    });
    describe('When getting list of radio stations', function () {
        describe('with multiple radio stations', function () {
            var radioStations;
            beforeEach(function (done) {
                soapObject = { 
                    's:Envelope': { 
                        's:Body' : { 
                            'u:ReadListResponse' : {
                                'ChannelList' : '<ChannelList><Entry><Id>23</Id><Metadata>&lt;DIDL-Lite xmlns:dc=&quot;http://purl.org/dc/elements/1.1/&quot; xmlns:upnp=&quot;urn:schemas-upnp-org:metadata-1-0/upnp/&quot; xmlns=&quot;urn:schemas-upnp-org:metadata-1-0/DIDL-Lite/&quot;&gt;&lt;item id=&quot;&quot; parentID=&quot;&quot; restricted=&quot;True&quot;&gt;&lt;dc:title&gt;BBC Radio 6 Music (AAA)&lt;/dc:title&gt;&lt;res protocolInfo=&quot;*:*:*:*&quot; bitrate=&quot;40000&quot;&gt;http://opml.radiotime.com/Tune.ashx?id=s44491&amp;amp;formats=mp3,wma,aac,wmvideo,ogg,hls&amp;amp;partnerId=ah2rjr68&amp;amp;username=bazwilliams&amp;amp;c=ebrowse&lt;/res&gt;&lt;upnp:albumArtURI&gt;http://cdn-radiotime-logos.tunein.com/s44491g.png&lt;/upnp:albumArtURI&gt;&lt;upnp:class&gt;object.item.audioItem&lt;/upnp:class&gt;&lt;/item&gt;&lt;/DIDL-Lite&gt;</Metadata></Entry><Entry><Id>23</Id><Metadata>&lt;DIDL-Lite xmlns:dc=&quot;http://purl.org/dc/elements/1.1/&quot; xmlns:upnp=&quot;urn:schemas-upnp-org:metadata-1-0/upnp/&quot; xmlns=&quot;urn:schemas-upnp-org:metadata-1-0/DIDL-Lite/&quot;&gt;&lt;item id=&quot;&quot; parentID=&quot;&quot; restricted=&quot;True&quot;&gt;&lt;dc:title&gt;BBC Radio 7 Music (AAA)&lt;/dc:title&gt;&lt;res protocolInfo=&quot;*:*:*:*&quot; bitrate=&quot;40000&quot;&gt;http://opml.radiotime.com/Tune.ashx?id=s44491&amp;amp;formats=mp3,wma,aac,wmvideo,ogg,hls&amp;amp;partnerId=ah2rjr68&amp;amp;username=bazwilliams&amp;amp;c=ebrowse&lt;/res&gt;&lt;upnp:albumArtURI&gt;http://cdn-radiotime-logos.tunein.com/s44491g.png&lt;/upnp:albumArtURI&gt;&lt;upnp:class&gt;object.item.audioItem&lt;/upnp:class&gt;&lt;/item&gt;&lt;/DIDL-Lite&gt;</Metadata></Entry></ChannelList>'
                            }
                        }
                    }
                };
                ds.retrieveRadioStationDetails([23, 34], function (err, data) {
                    radioStations = data;
                    done();
                });
                soapRequestCb({
                    statusCode: 200,
                    setEncoding: sinon.spy()
                });
            });
            it('Should use the radio control uri', function () {
                expect(soapRequestArgs[1]).to.be.eql('/radio');
            });
            it('Should send formatted track list in soap request', function () {
                expect(soapRequestArgs[4]).to.be.eql('<IdList>23 34</IdList>');
            });
            it('Radio station list should be an array with 2 items', function () {
                expect(radioStations).to.be.an('array').and.have.length(2);
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
        describe('with a single radio stations', function () {
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
                ds.retrieveRadioStationDetails([23], function (err, data) {
                    expect(err).to.be.null;
                    radioStations = data;
                    done();
                });
                soapRequestCb({
                    statusCode: 200,
                    setEncoding: sinon.spy()
                });
            });
            it('Should use the radio control uri', function () {
                expect(soapRequestArgs[1]).to.be.eql('/radio');
            });
            it('Should send formatted track list in soap request', function () {
                expect(soapRequestArgs[4]).to.be.eql('<IdList>23</IdList>');
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
                statusCode: 200,
                setEncoding: sinon.spy()
            });
        });
        it('Should use the control control uri', function () {
            expect(soapRequestArgs[1]).to.be.eql('/control');
        });
        it('Track should be correct', function () {
            expect(trackDetails.track).to.be.eql('http://track/test');
        });
        it('Metadata should be correct', function () {
            expect(trackDetails.metadata).to.be.eql('Metadata');
        });
    });
    describe('When setting the radio channel', function () {
        beforeEach(function (done) {
            var radioChannel = {
                "id": "5",
                "uri": "http:\/\/opml.radiotime.com\/Tune.ashx?id=s44491&formats=mp3,wma,aac,wmvideo,ogg,hls&partnerId=ah2rjr68&username=bazwilliams&c=ebrowse"
            };
            ds.setRadioChannel(radioChannel, function (err, data) {
                done();
            });
            soapRequestCb({
                statusCode: 200,
                setEncoding: sinon.spy()
            });
        });
        it('Should use the radio control uri', function () {
            expect(soapRequestArgs[1]).to.be.eql('/radio');
        });
        it('Should send formatted radio id and uri in soap request', function () {
            expect(soapRequestArgs[4]).to.be.eql('<Value>5</Value><Uri>http://opml.radiotime.com/Tune.ashx?id=s44491&amp;formats=mp3,wma,aac,wmvideo,ogg,hls&amp;partnerId=ah2rjr68&amp;username=bazwilliams&amp;c=ebrowse</Uri>');
        });
    });
    describe('When changing the source', function () {
        beforeEach(function (done) {
            var sourceId = 11;
            ds.changeSource(sourceId, function (err, data) {
                done();
            });
            soapRequestCb({
                statusCode: 200,
                setEncoding: sinon.spy()
            });
        });
        it('Should use the product control uri', function () {
            expect(soapRequestArgs[1]).to.be.eql('/product');
        });
        it('Should send formatted source id soap request', function () {
            expect(soapRequestArgs[4]).to.be.eql('<Value>11</Value>');
        });
    });
    describe('When getting sleep state', function() {
        var standbyState;
        beforeEach(function (done) {
            soapObject = { 
                's:Envelope': { 
                    's:Body' : { 
                        'u:StandbyResponse' : {
                            Value: 1
                        }
                    }
                }
            };
            ds.standbyState(function (err, data) {
                expect(err).to.be.null;
                standbyState = data;
                done();
            });
            soapRequestCb({
                statusCode: 200,
                setEncoding: sinon.spy()
            });
        });
        it('Should use the product control uri', function () {
            expect(soapRequestArgs[1]).to.be.eql('/product');
        });
        it('Standby state should be correct', function () {
            expect(standbyState).to.be.eql(1);
        });
    });
    describe('When putting to sleep', function() {
        beforeEach(function (done) {
            ds.powerOff(function (err, data) {
                done();
            });
            soapRequestCb({
                statusCode: 200,
                setEncoding: sinon.spy()
            });
        });
        it('Should use the product control uri', function () {
            expect(soapRequestArgs[1]).to.be.eql('/product');
        });
        it('Should send formatted set sleep value to 1', function () {
            expect(soapRequestArgs[4]).to.be.eql('<Value>1</Value>');
        });
    });
    describe('When waking up from sleep', function() {
        beforeEach(function (done) {
            ds.powerOn(function (err, data) {
                done();
            });
            soapRequestCb({
                statusCode: 200,
                setEncoding: sinon.spy()
            });
        });
        it('Should use the product control uri', function () {
            expect(soapRequestArgs[1]).to.be.eql('/product');
        });
        it('Should send formatted set sleep value to 0', function () {
            expect(soapRequestArgs[4]).to.be.eql('<Value>0</Value>');
        });
    });
    describe('When playing the radio', function () {
        beforeEach(function (done) {
            ds.playRadio(function (err, data) {
                done();
            });
            soapRequestCb({
                statusCode: 200,
                setEncoding: sinon.spy()
            });
        });
        it('Should use the radio control uri', function () {
            expect(soapRequestArgs[1]).to.be.eql('/radio');
        });
    });
    describe('When increasing the volume', function () {
        beforeEach(function (done) {
            ds.volumeInc(function (err, data) {
                done();
            });
            soapRequestCb({
                statusCode: 200,
                setEncoding: sinon.spy()
            });
        });
        it('Should use the volume control uri', function () {
            expect(soapRequestArgs[1]).to.be.eql('/volume');
        });
    });
    describe('When decreasing the volume', function () {
        beforeEach(function (done) {
            ds.volumeDec(function (err, data) {
                done();
            });
            soapRequestCb({
                statusCode: 200,
                setEncoding: sinon.spy()
            });
        });
        it('Should use the volume control uri', function () {
            expect(soapRequestArgs[1]).to.be.eql('/volume');
        });
    });
    describe('When queuing', function () {
        describe(' a track within a single resource', function () {
            var newTrackId;
            beforeEach(function (done) {
                var trackDetailsXml = '<DIDL-Lite xmlns="urn:schemas-upnp-org:metadata-1-0/DIDL-Lite/"><item><dc:title xmlns:dc="http://purl.org/dc/elements/1.1/">Totally</dc:title><upnp:class xmlns:upnp="urn:schemas-upnp-org:metadata-1-0/upnp/">object.item.audioItem.musicTrack</upnp:class><upnp:albumArtURI xmlns:upnp="urn:schemas-upnp-org:metadata-1-0/upnp/">http://192.168.1.126:9790/minimserver/*/music/Albums/Joe*20Stilgoe*20-*20New*20Songs*20For*20Old*20Souls/01*20-*20Totally.flac/$!picture-299-6806038.png</upnp:albumArtURI><upnp:album xmlns:upnp="urn:schemas-upnp-org:metadata-1-0/upnp/">New Songs For Old Souls (Digital Deluxe Version)</upnp:album><upnp:artist xmlns:upnp="urn:schemas-upnp-org:metadata-1-0/upnp/">Joe Stilgoe</upnp:artist><upnp:artist role="AlbumArtist" xmlns:upnp="urn:schemas-upnp-org:metadata-1-0/upnp/">Joe Stilgoe</upnp:artist><dc:date xmlns:dc="http://purl.org/dc/elements/1.1/">2015-01-01</dc:date><upnp:genre xmlns:upnp="urn:schemas-upnp-org:metadata-1-0/upnp/">Jazz</upnp:genre><res sampleFrequency="96000" bitsPerSample="24" bitrate="576000" protocolInfo="http-get:*:audio/x-flac:*">http://192.168.1.126:9790/minimserver/*/music/Albums/Joe*20Stilgoe*20-*20New*20Songs*20For*20Old*20Souls/01*20-*20Totally.flac</res></item></DIDL-Lite>';
                soapObject = { 
                    's:Envelope': { 
                        's:Body' : { 
                            'u:InsertResponse' : {
                                NewId: 13,
                            }
                        }
                    }
                };
                var afterId = 12;
                ds.queueTrack(trackDetailsXml, afterId, function (err, data) {
                    expect(err).to.be.null;
                    newTrackId = data;
                    done();
                });
                soapRequestCb({
                    statusCode: 200,
                    setEncoding: sinon.spy()
                });
            })
            it('Should use the playlist control uri', function () {
                expect(soapRequestArgs[1]).to.be.eql('/playlist');
            });
            it('Should send formatted source id soap request', function () {
                expect(soapRequestArgs[4]).to.be.eql('<AfterId>12</AfterId><Uri>http://192.168.1.126:9790/minimserver/*/music/Albums/Joe*20Stilgoe*20-*20New*20Songs*20For*20Old*20Souls/01*20-*20Totally.flac</Uri><Metadata>&lt;DIDL-Lite xmlns=&quot;urn:schemas-upnp-org:metadata-1-0/DIDL-Lite/&quot;&gt;&lt;item&gt;&lt;dc:title xmlns:dc=&quot;http://purl.org/dc/elements/1.1/&quot;&gt;Totally&lt;/dc:title&gt;&lt;upnp:class xmlns:upnp=&quot;urn:schemas-upnp-org:metadata-1-0/upnp/&quot;&gt;object.item.audioItem.musicTrack&lt;/upnp:class&gt;&lt;upnp:albumArtURI xmlns:upnp=&quot;urn:schemas-upnp-org:metadata-1-0/upnp/&quot;&gt;http://192.168.1.126:9790/minimserver/*/music/Albums/Joe*20Stilgoe*20-*20New*20Songs*20For*20Old*20Souls/01*20-*20Totally.flac/$!picture-299-6806038.png&lt;/upnp:albumArtURI&gt;&lt;upnp:album xmlns:upnp=&quot;urn:schemas-upnp-org:metadata-1-0/upnp/&quot;&gt;New Songs For Old Souls (Digital Deluxe Version)&lt;/upnp:album&gt;&lt;upnp:artist xmlns:upnp=&quot;urn:schemas-upnp-org:metadata-1-0/upnp/&quot;&gt;Joe Stilgoe&lt;/upnp:artist&gt;&lt;upnp:artist role=&quot;AlbumArtist&quot; xmlns:upnp=&quot;urn:schemas-upnp-org:metadata-1-0/upnp/&quot;&gt;Joe Stilgoe&lt;/upnp:artist&gt;&lt;dc:date xmlns:dc=&quot;http://purl.org/dc/elements/1.1/&quot;&gt;2015-01-01&lt;/dc:date&gt;&lt;upnp:genre xmlns:upnp=&quot;urn:schemas-upnp-org:metadata-1-0/upnp/&quot;&gt;Jazz&lt;/upnp:genre&gt;&lt;res sampleFrequency=&quot;96000&quot; bitsPerSample=&quot;24&quot; bitrate=&quot;576000&quot; protocolInfo=&quot;http-get:*:audio/x-flac:*&quot;&gt;http://192.168.1.126:9790/minimserver/*/music/Albums/Joe*20Stilgoe*20-*20New*20Songs*20For*20Old*20Souls/01*20-*20Totally.flac&lt;/res&gt;&lt;/item&gt;&lt;/DIDL-Lite&gt;</Metadata>');
            });
            it('Should return the new track id', function () {
                expect(newTrackId).to.be.eql(13);
            });
        });
        describe(' a track with multiple resources', function () {
            var newTrackId;
            beforeEach(function (done) {
                var trackDetailsXml = '<DIDL-Lite xmlns="urn:schemas-upnp-org:metadata-1-0/DIDL-Lite/"><item><dc:title xmlns:dc="http://purl.org/dc/elements/1.1/">Totally</dc:title><upnp:class xmlns:upnp="urn:schemas-upnp-org:metadata-1-0/upnp/">object.item.audioItem.musicTrack</upnp:class><upnp:albumArtURI xmlns:upnp="urn:schemas-upnp-org:metadata-1-0/upnp/">http://192.168.1.126:9790/minimserver/*/music/Albums/Joe*20Stilgoe*20-*20New*20Songs*20For*20Old*20Souls/01*20-*20Totally.flac/$!picture-299-6806038.png</upnp:albumArtURI><upnp:album xmlns:upnp="urn:schemas-upnp-org:metadata-1-0/upnp/">New Songs For Old Souls (Digital Deluxe Version)</upnp:album><upnp:artist xmlns:upnp="urn:schemas-upnp-org:metadata-1-0/upnp/">Joe Stilgoe</upnp:artist><upnp:artist role="AlbumArtist" xmlns:upnp="urn:schemas-upnp-org:metadata-1-0/upnp/">Joe Stilgoe</upnp:artist><dc:date xmlns:dc="http://purl.org/dc/elements/1.1/">2015-01-01</dc:date><upnp:genre xmlns:upnp="urn:schemas-upnp-org:metadata-1-0/upnp/">Jazz</upnp:genre><res sampleFrequency="96000" bitsPerSample="24" bitrate="576000" protocolInfo="http-get:*:audio/x-flac:*">http://192.168.1.126:9790/minimserver/*/music/Albums/Joe*20Stilgoe*20-*20New*20Songs*20For*20Old*20Souls/01*20-*20Totally.flac</res><res sampleFrequency="96000" bitsPerSample="24" bitrate="576000" protocolInfo="http-get:*:audio/x-flac:*">http://192.168.1.126:9790/minimserver/*/music/Albums/Joe*20Stilgoe*20-*20New*20Songs*20For*20Old*20Souls/01*20-*20TotallyRepeated.flac</res></item></DIDL-Lite>';
                soapObject = { 
                    's:Envelope': { 
                        's:Body' : { 
                            'u:InsertResponse' : {
                                NewId: 13,
                            }
                        }
                    }
                };
                var afterId = 12;
                ds.queueTrack(trackDetailsXml, afterId, function (err, data) {
                    expect(err).to.be.null;
                    newTrackId = data;
                    done();
                });
                soapRequestCb({
                    statusCode: 200,
                    setEncoding: sinon.spy()
                });
            })
            it('Should use the playlist control uri', function () {
                expect(soapRequestArgs[1]).to.be.eql('/playlist');
            });
            it('Should send formatted source id soap request', function () {
                expect(soapRequestArgs[4]).to.be.eql('<AfterId>12</AfterId><Uri>http://192.168.1.126:9790/minimserver/*/music/Albums/Joe*20Stilgoe*20-*20New*20Songs*20For*20Old*20Souls/01*20-*20Totally.flac</Uri><Metadata>&lt;DIDL-Lite xmlns=&quot;urn:schemas-upnp-org:metadata-1-0/DIDL-Lite/&quot;&gt;&lt;item&gt;&lt;dc:title xmlns:dc=&quot;http://purl.org/dc/elements/1.1/&quot;&gt;Totally&lt;/dc:title&gt;&lt;upnp:class xmlns:upnp=&quot;urn:schemas-upnp-org:metadata-1-0/upnp/&quot;&gt;object.item.audioItem.musicTrack&lt;/upnp:class&gt;&lt;upnp:albumArtURI xmlns:upnp=&quot;urn:schemas-upnp-org:metadata-1-0/upnp/&quot;&gt;http://192.168.1.126:9790/minimserver/*/music/Albums/Joe*20Stilgoe*20-*20New*20Songs*20For*20Old*20Souls/01*20-*20Totally.flac/$!picture-299-6806038.png&lt;/upnp:albumArtURI&gt;&lt;upnp:album xmlns:upnp=&quot;urn:schemas-upnp-org:metadata-1-0/upnp/&quot;&gt;New Songs For Old Souls (Digital Deluxe Version)&lt;/upnp:album&gt;&lt;upnp:artist xmlns:upnp=&quot;urn:schemas-upnp-org:metadata-1-0/upnp/&quot;&gt;Joe Stilgoe&lt;/upnp:artist&gt;&lt;upnp:artist role=&quot;AlbumArtist&quot; xmlns:upnp=&quot;urn:schemas-upnp-org:metadata-1-0/upnp/&quot;&gt;Joe Stilgoe&lt;/upnp:artist&gt;&lt;dc:date xmlns:dc=&quot;http://purl.org/dc/elements/1.1/&quot;&gt;2015-01-01&lt;/dc:date&gt;&lt;upnp:genre xmlns:upnp=&quot;urn:schemas-upnp-org:metadata-1-0/upnp/&quot;&gt;Jazz&lt;/upnp:genre&gt;&lt;res sampleFrequency=&quot;96000&quot; bitsPerSample=&quot;24&quot; bitrate=&quot;576000&quot; protocolInfo=&quot;http-get:*:audio/x-flac:*&quot;&gt;http://192.168.1.126:9790/minimserver/*/music/Albums/Joe*20Stilgoe*20-*20New*20Songs*20For*20Old*20Souls/01*20-*20Totally.flac&lt;/res&gt;&lt;res sampleFrequency=&quot;96000&quot; bitsPerSample=&quot;24&quot; bitrate=&quot;576000&quot; protocolInfo=&quot;http-get:*:audio/x-flac:*&quot;&gt;http://192.168.1.126:9790/minimserver/*/music/Albums/Joe*20Stilgoe*20-*20New*20Songs*20For*20Old*20Souls/01*20-*20TotallyRepeated.flac&lt;/res&gt;&lt;/item&gt;&lt;/DIDL-Lite&gt;</Metadata>');
            });
            it('Should return the new track id', function () {
                expect(newTrackId).to.be.eql(13);
            });
        })
    });
    describe('When getting sources', function () {
        var sources;
        beforeEach(function (done) {
            var sourceXml = '<SourceList><Source><Name>Playlist</Name><Type>Playlist</Type><Visible>true</Visible></Source><Source><Name>Radio</Name><Type>Radio</Type><Visible>true</Visible></Source><Source><Name>UPnP AV</Name><Type>UpnpAv</Type><Visible>false</Visible></Source><Source><Name>Songcast</Name><Type>Receiver</Type><Visible>true</Visible></Source><Source><Name>Net Aux</Name><Type>NetAux</Type><Visible>false</Visible></Source><Source><Name>Analog1</Name><Type>Analog</Type><Visible>false</Visible></Source><Source><Name>Analog2</Name><Type>Analog</Type><Visible>false</Visible></Source><Source><Name>Analog3</Name><Type>Analog</Type><Visible>false</Visible></Source><Source><Name>LP12</Name><Type>Analog</Type><Visible>true</Visible></Source><Source><Name>Front Aux</Name><Type>Analog</Type><Visible>true</Visible></Source><Source><Name>SPDIF1</Name><Type>Digital</Type><Visible>false</Visible></Source><Source><Name>SPDIF2</Name><Type>Digital</Type><Visible>false</Visible></Source><Source><Name>SPDIF3</Name><Type>Digital</Type><Visible>false</Visible></Source><Source><Name>TOSLINK1</Name><Type>Digital</Type><Visible>false</Visible></Source><Source><Name>TOSLINK2</Name><Type>Digital</Type><Visible>false</Visible></Source><Source><Name>TOSLINK3</Name><Type>Digital</Type><Visible>false</Visible></Source><Source><Name>Bluray</Name><Type>Hdmi</Type><Visible>true</Visible></Source><Source><Name>Tivo</Name><Type>Hdmi</Type><Visible>true</Visible></Source><Source><Name>HDMI3</Name><Type>Hdmi</Type><Visible>false</Visible></Source><Source><Name>Slimport</Name><Type>Hdmi</Type><Visible>true</Visible></Source></SourceList>';
            soapObject = { 
                's:Envelope': { 
                    's:Body' : { 
                        'u:SourceXmlResponse' : {
                            Value: sourceXml,
                        }
                    }
                }
            };
            ds.getSources(function (err, data) {
                expect(err).to.be.null;
                sources = data;
                done();
            });
            soapRequestCb({
                statusCode: 200,
                setEncoding: sinon.spy()
            });
        })
        it('Should use the product control uri', function () {
            expect(soapRequestArgs[1]).to.be.eql('/product');
        });
        it('Should return correct number of sources', function () {
            expect(sources).to.be.an('array').and.have.length(20);
        });
        it('Should have correct sources', function () {
            expect(sources[0]).to.be.eql({
                name: 'Playlist',
                type: 'Playlist',
                visible: true
            });
        });
    })
});