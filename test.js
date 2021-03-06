/* eslint-env node, mocha */

const assert = require('chai').assert;
const libunqfy = require('./unqfy');
const idGenerator = require("./models/idGenerator");
const exceptionsArt = require('./exceptions/artistException');


function createAndAddArtist(unqfy, artistName, country) {
  let artist;
  try {
     artist = unqfy.addArtist({ name: artistName, country: country });
  } catch (error) {
    console.log('error method runned: ', error.name, error.message);
    console.log(error.stack);
    throw new exceptionsArt.ArtistWithSameName(`The artist ${artistName} already existed.`);
  }
  return artist;
}

function getArtistById(unqfy, artistId) {
  let artist;
  try {
     artist = unqfy.getArtistById(artistId);
  } catch (error) {
    console.log('error method runned: ', error.name, error.message);
    console.log(error.stack);
    throw new exceptionsArt.ArtistIdDoesNotExist(`The artist with id ${artistId} does not exist`);
  }
  return artist;
}

function createAndAddAlbum(unqfy, artistId, albumName, albumYear) {
  return unqfy.addAlbum(artistId, { name: albumName, year: albumYear });
}

function createAndAddTrack(unqfy, albumId, trackName, trackDuraction, trackGenres) {
  return unqfy.addTrack(albumId, { name: trackName, duration: trackDuraction, genres: trackGenres });
}

function createAndAddUser(unqfy, name) {
  return unqfy.addUser(name);
}


describe('Add, remove and filter data', () => {
  let unqfy = null;
  let artistTest = null;

  beforeEach(() => {
    unqfy = new libunqfy.UNQfy();
    idGenerator.resetIDs();

    // It is not added to UNQfy then it has no ID (dict)
    artistTest = { name: 'Guns n\' Roses', country: 'USA' };
  });

  it('should add an artist', () => {
    const artist = createAndAddArtist(unqfy, 'Guns n\' Roses', 'USA');

    assert.equal(artist.name, 'Guns n\' Roses');
    assert.equal(artist.country, 'USA');

  });

  it('should add the same artist twice', () => {
    const artistDict = { name: 'Guns n\' Roses', country: 'USA' };
    createAndAddArtist(unqfy, artistDict.name, artistDict.country);

    assert.throw(() => {createAndAddArtist(unqfy, artistTest.name, artistTest.country);}, Error, `The artist ${artistTest.name} already existed.`);
  });

  it('get artist with existing ID', () => {
    /**
     * create API for getArtist/AlBum/Track/PlaylistByID
     */
    createAndAddArtist(unqfy, 'Guns n\' Roses', 'USA');

    const fakeId = 9;
    assert.throw(() => {getArtistById(unqfy, fakeId);}, Error, `The artist with id ${fakeId} does not exist`);
  });

  it('should add an album to an artist', () => {
    const artist = createAndAddArtist(unqfy, 'Guns n\' Roses', 'USA');
    const album = createAndAddAlbum(unqfy, artist.id, 'Appetite for Destruction', 1987);

    assert.equal(album.name, 'Appetite for Destruction');
    assert.equal(album.year, 1987);
  });

  it('should remove an album to an artist', () => {
    const artist = createAndAddArtist(unqfy, 'Guns n\' Roses', 'USA');
    const album1 = createAndAddAlbum(unqfy, artist.id, 'Appetite for Destruction', 1987);
    createAndAddAlbum(unqfy, artist.id, 'Use Your Illusion II', 1991);

    assert.equal(artist.albums.length, 2);

    artist.removeAlbum(album1.id);
    assert.equal(artist.albums.length, 1);
  });

  it('should add a track to an album', () => {
    const artist = createAndAddArtist(unqfy, 'Guns n\' Roses', 'USA');
    const album = createAndAddAlbum(unqfy, artist.id, 'Appetite for Destruction', 1987);
    const track = createAndAddTrack(unqfy, album.id, 'Welcome to the jungle', 200, ['rock', 'hard rock']);

    assert.equal(track.name, 'Welcome to the jungle');
    assert.strictEqual(track.duration, 200);
    assert.equal(track.genres.includes('rock'), true);
    assert.equal(track.genres.includes('hard rock'), true);
    assert.lengthOf(track.genres, 2);
  });


  it(`Should remove a track from an artist's album`, () => {
    const artist = createAndAddArtist(unqfy, 'Guns n\' Roses', 'USA');
    const album = createAndAddAlbum(unqfy, artist.id, 'Appetite for Destruction', 1987);
    const track = createAndAddTrack(unqfy, album.id, 'Welcome to the jungle', 200, ['rock', 'hard rock']);

    unqfy.removeTrack(artist.id, track.idTrack);

    assert.isEmpty(unqfy.getAlbumById(album.id).tracks, 'is not empty');
    assert.equal(unqfy.getAlbumById(album.id).tracks.length, 0);
  });

  it('should remove an artist', () => {
    const artist = createAndAddArtist(unqfy, 'Guns n\' Roses', 'USA');

    assert.equal(artist.name, 'Guns n\' Roses');
    assert.equal(artist.country, 'USA');
    assert.equal(unqfy.artists.length,1);

    unqfy.removeArtist(artist.id);
    
    assert.equal(unqfy.artists.length,0);

  });

  it('should find different things by name', () => {
    const artist1 = createAndAddArtist(unqfy, 'Guns n\' Roses', 'USA');
    const album1 = createAndAddAlbum(unqfy, artist1.id, 'Roses Album', 1987);
    const track = createAndAddTrack(unqfy, album1.id, 'Roses track', 200, ['pop', 'movie']);
    const playlist = unqfy.createPlaylist('Roses playlist', ['pop'], 1400);

    const results = unqfy.searchByName('Roses');
    assert.deepEqual(results, {
      artists: [artist1],
      albums: [album1],
      tracks: [track],
      playlists: [playlist]
    });
  });

  it('should get all tracks matching genres', () => {
    const artist1 = createAndAddArtist(unqfy, 'Guns n\' Roses', 'USA');
    const album1 = createAndAddAlbum(unqfy, artist1.id, 'Appetite for Destruction', 1987);
    const t0 = createAndAddTrack(unqfy, album1.id, 'Welcome to the jungle', 200, ['rock', 'hard rock', 'movie']);
    const t1 = createAndAddTrack(unqfy, album1.id, 'Sweet Child o\' Mine', 500, ['rock', 'hard rock', 'pop', 'movie']);

    const artist2 = createAndAddArtist(unqfy, 'Michael Jackson', 'USA');
    const album2 = createAndAddAlbum(unqfy, artist2.id, 'Thriller', 1987);
    const t2 = createAndAddTrack(unqfy, album2.id, 'Trhiller', 200, ['pop', 'movie']);
    createAndAddTrack(unqfy, album2.id, 'Another song', 500, ['classic']);
    const t3 = createAndAddTrack(unqfy, album2.id, 'Another song II', 500, ['movie']);

    const tracksMatching = unqfy.getTracksMatchingGenres(['pop', 'movie']);

    // assert.equal(tracks.matching.constructor.name, Array);
    assert.isArray(tracksMatching);
    assert.lengthOf(tracksMatching, 4);
    assert.equal(tracksMatching.includes(t0), true);
    assert.equal(tracksMatching.includes(t1), true);
    assert.equal(tracksMatching.includes(t2), true);
    assert.equal(tracksMatching.includes(t3), true);
  });

  it('should get all tracks matching artist', () => {
    const artist = createAndAddArtist(unqfy, 'Guns n\' Roses', 'USA');
    const album = createAndAddAlbum(unqfy, artist.id, 'Appetite for Destruction', 1987);
    const t1 = createAndAddTrack(unqfy, album.id, 'Welcome to the jungle', 200, ['rock', 'hard rock']);
    const t2 = createAndAddTrack(unqfy, album.id, 'It\'s so easy', 200, ['rock', 'hard rock']);

    const album2 = createAndAddAlbum(unqfy, artist.id, 'Use Your Illusion I', 1992);
    const t3 = createAndAddTrack(unqfy, album2.id, 'Don\'t Cry', 500, ['rock', 'hard rock']);

    const artist2 = createAndAddArtist(unqfy, 'Michael Jackson', 'USA');
    const album3 = createAndAddAlbum(unqfy, artist2.id, 'Thriller', 1987);
    createAndAddTrack(unqfy, album3.id, 'Thriller', 200, ['pop', 'movie']);
    createAndAddTrack(unqfy, album3.id, 'Another song', 500, ['classic']);
    createAndAddTrack(unqfy, album3.id, 'Another song II', 500, ['movie']);

    const matchingTracks = unqfy.getTracksMatchingArtist(artist.name);

    assert.isArray(matchingTracks);
    assert.lengthOf(matchingTracks, 3);
    assert.isTrue(matchingTracks.includes(t1));
    assert.isTrue(matchingTracks.includes(t2));
    assert.isTrue(matchingTracks.includes(t3));
  });
});

describe('Playlist Creation and properties', () => {
  let unqfy = null;

  beforeEach(() => {
    unqfy = new libunqfy.UNQfy();
    idGenerator.resetIDs();
  });

  it('should create a playlist as requested', () => {
    const artist = createAndAddArtist(unqfy, 'Guns n\' Roses', 'USA');
    const album = createAndAddAlbum(unqfy, artist.id, 'Appetite for Destruction', 1987);
    const t1 = createAndAddTrack(unqfy, album.id, 'Welcome to the jungle', 200, ['rock', 'hard rock', 'movie']);
    const t5 = createAndAddTrack(unqfy, album.id, 'Sweet Child o\' Mine', 1500, ['rock', 'hard rock', 'pop', 'movie']);

    const artist2 = createAndAddArtist(unqfy, 'Michael Jackson', 'USA');
    const album2 = createAndAddAlbum(unqfy, artist2.id, 'Thriller', 1987);
    const t2 = createAndAddTrack(unqfy, album2.id, 'Thriller', 200, ['pop', 'movie']);
    const t3 = createAndAddTrack(unqfy, album2.id, 'Another song', 500, ['pop']);
    const t4 = createAndAddTrack(unqfy, album2.id, 'Another song II', 500, ['pop']);

    const playlist = unqfy.createPlaylist('my playlist', ['pop', 'rock'], 1400);

    assert.equal(playlist.name, 'my playlist');
    assert.isAtMost(playlist.duration(), 1400);
    assert.isTrue(playlist.hasTrack(t1));
    assert.isTrue(playlist.hasTrack(t2));
    assert.isTrue(playlist.hasTrack(t3));
    assert.isTrue(playlist.hasTrack(t4));
    assert.isFalse(playlist.hasTrack(t5));
    assert.lengthOf(playlist.tracks, 4);
  });
});

describe('User Creation', () => {
  let unqfy = null;
  beforeEach(() => {
      unqfy = new libunqfy.UNQfy();
      idGenerator.resetIDs();
  });

  it("should create a user",() =>{
    const u1 = createAndAddUser(unqfy,"Pepe");
    const u2 = createAndAddUser(unqfy,"Coqui");
    assert.equal(u1.name, 'Pepe');
    assert.equal(u2.name, 'Coqui');
  });

  it('canciones que escucho user', () => {
    const artist1 = createAndAddArtist(unqfy, 'Guns n\' Roses', 'USA');
    const album1 = createAndAddAlbum(unqfy, artist1.id, 'Leyendas', 1920);
    const track1 = createAndAddTrack(unqfy, album1.id, 'Welcome to the jungle', 200, ['rock', 'hard rock', 'movie']);
    const t2 = createAndAddTrack(unqfy, album1.id, 'Thriller', 200, ['pop', 'movie']);
    const u1 = createAndAddUser(unqfy,"Pepe");
    unqfy.addListenedSong(u1.id,track1.idTrack);
    assert.equal(unqfy.tracksListenedByUser(u1.id).length, 1);
    assert.isTrue(unqfy.tracksListenedByUser(u1.id).includes(track1));
    unqfy.addListenedSong(u1.id,track1.idTrack);
    unqfy.addListenedSong(u1.id,track1.idTrack);
    unqfy.addListenedSong(u1.id,t2.idTrack);
    assert.equal(unqfy.timesListenedTrackByUser(u1.id,track1.idTrack),3);
    assert.equal(unqfy.tracksListenedByUser(u1.id).length, 2);
  });


});
