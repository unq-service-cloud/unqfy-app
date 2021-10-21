const picklify = require('picklify'); // para cargar/guarfar unqfy
const fs = require('fs'); // para cargar/guarfar unqfy
const Artist = require("./models/artist"); // El modelo Artista
const artistExceptions = require("./exceptions/artistException.js");
const userExceptions = require("./exceptions/userException.js");
const unqfyExceptions = require("./exceptions/unqfyException.js");
const Album = require('./models/album.js');
const Track = require('./models/tracks');
const User = require("./models/user");
const Playlist = require('./models/playlist.js');

class UNQfy {

  constructor(){
    this.artists = [];
    this.artistsSize = 0;
    this.playlists = [];
    this.users = [];
    this.id2Playlist = 0;
  }

  printArray(array){
    array.forEach(elem=> console.log(elem));
  }

  addUser(userName){
    if(this.users.some(elem=> elem.name === userName)){
      throw new userExceptions.UserException(userName);
    }else{
      const user = new User(userName);
      this.users.push(user);
      return user;
    }
  }

  getUserById(id){
    return this.users.find(elem=> elem.id === id);
  }

  addListenedSong(userId,trackId){
    const user = this.getUserById(userId);
    const track = this.getTrackById(trackId);
    user.listenTrack(track);
  }

  tracksListenedByUser(userId){
    const user = this.getUserById(userId);
    const tracks = user.differentsTracksListened();
    return tracks;
  }

  timesListenedTrackByUser(userId,trackId){
    const track = this.getTrackById(trackId);
    const tracks = this.getUserById(userId).amountTrackListened(track);
    return tracks;
  }

  removeUser(idUser){
    const user = this.getUserById(idUser);
    this.users = this.removeItemWithIdFromArr(user,this.users);
  }

  // artistData: objeto JS con los datos necesarios para crear un artista
  //   artistData.name (string)
  //   artistData.country (string)
  // retorna: el nuevo artista creado
  /* Crea un artista y lo agrega a unqfy.
  El objeto artista creado debe soportar (al menos):
    - una propiedad name (string)
    - una propiedad country (string)
  */
  addArtist(artistData) {
    const artist = this.addNewArtist(artistData);
    return artist;
  }

  addNewArtist(artist) {
    if(this.haveArtistName(artist.name)){
        throw new artistExceptions.ArtistWithSameName(`The artist ${artist.name} already existed.`);
    } else {
      const artist1 = new Artist(artist.name,artist.country);
      this.artists.push(artist1);
      return artist1;
    }
  }

  removeArtist(artistId){
    const art = this.getArtistById(artistId);
    art.albums.forEach(elem => this.removeAlbum(artistId,elem.id));
    this.artists = this.removeItemWithIdFromArr(art,this.artists);
  }

  getArtistById(id) {
    const artist = this.artists.find(artist => artist.id === id);
    if (artist !== undefined){
      return artist;
    }else{
      throw new artistExceptions.ArtistIdDoesNotExist(`The artist with id ${id} does not exist`);
    }
  }

  getArtists(){
    return this.artists;
  }

  getTracksArtist(id){
    const art = this.getArtistById(id);
    return art.getTracks();

  }

  getAlbumsArtist(id){
    const art = this.getArtistById(id);
    return art.getAlbums();
  }

  removeItemWithIdFromArr(item,arr){
    return arr.filter(elem => elem.id !==item.id );
  }

  printAllArtists(){
    this.printArray(this.artists);
  }

  printAllAlbums(){
    this.printArray(this.getAlbums());
  }

  printAllTracks(){
    this.printArray(this.getTracks());
  }

  // albumData: objeto JS con los datos necesarios para crear un album
  //   albumData.name (string)
  //   albumData.year (number)
  // retorna: el nuevo album creado
  /* Crea un album y lo agrega al artista con id artistId.
    El objeto album creado debe tener (al menos):
     - una propiedad name (string)
     - una propiedad year (number)
  */
  addAlbum(artistId, albumData) {
    const artist = this.getArtistById(artistId);
    const album = artist.addAlbum(albumData);
    return album;
  }

  getTracksAlbum(idAlbum){
    const abm = this.getAlbumById(idAlbum);
    return abm.getTracks();
  }

  removeAlbum(artistId, albumId) {
    const artist = this.getArtistById(artistId);
    this.removeAlbum2Playlists(albumId);
    artist.removeAlbum(albumId);
  }

  getAlbumById(id) {
    const artistOfAlbum = this.artists.find(artist => artist.haveAlbum(id));
    if(artistOfAlbum !== undefined){
      const album = artistOfAlbum.getAlbumById(id);
      return album;
    }else{
        throw new unqfyExceptions.ArtistWithAlbumIdNotExist(`There is no artist with that albumId ${id}`);
    }
  }

  removeAlbum2Playlists(albumId) {
    const album = this.getAlbumById(albumId);
    this.removeTracksByAlbum(album);
  }

  removeTracksByAlbum(album) {
    album.tracks.forEach(track => {
      this.playlists.forEach(playlist => {
        playlist.removeTrack(track);
      });
    });
  }

  // trackData: objeto JS con los datos necesarios para crear un track
  //   trackData.name (string)
  //   trackData.duration (number)
  //   trackData.genres (lista de strings)
  // retorna: el nuevo track creado
  /* Crea un track y lo agrega al album con id albumId.
  El objeto track creado debe tener (al menos):
      - una propiedad name (string),
      - una propiedad duration (number),
      - una propiedad genres (lista de strings)
  */
  addTrack(albumId, trackData) {
    const albumObt = this.getAlbumById(albumId);
    const track = albumObt.addNewTrack(trackData);
    return track;
  }

  removeTrack(artistId, trackId) {
    const artist = this.getArtistById(artistId);
    this.removeTrack2Playlist(trackId);
    artist.removeTrack(trackId);
  }

  getTracks(){
    return this.getAlbums().reduce((acumulattor,actual) =>{
        return acumulattor.concat(actual.tracks);
      }, []);
  }

  getAlbums(){
    return this.artists.reduce((acumulattor,actual) =>{
        return acumulattor.concat(actual.albums);
    },[]);
  }

  getTrackById(id) {
    const artistWithTrack = this.artists.find(artist => artist.getTrackById(id));
    return artistWithTrack.getTrackById(id);
  }


  getTrackById2(id){
    let test = this.getTracks().find(elem => elem.idTrack === id);
    if(!test){
      throw new Error("Not Founddddd");
    }else{
      return test;
    }
  }

  getLyricsTrack(id){
    const track = this.getTrackById2(id);
    return track.getLyrics();
  }

  removeTrack2Playlist(trackId) {
    const track = this.getTrackById(trackId);
    this.playlists.forEach(playlist => {
      playlist.removeTrack(track);
    });
  }

  searchByName(scrappyWord) {
    const artists = this.matchingPartialByArtist(scrappyWord);
    const albums = this.matchingPartialByAlbum(scrappyWord);
    const tracks = this.matchingPartialByTrack(scrappyWord);
    const playlists = this.matchingPartialByPlaylist(scrappyWord);
    
    return {
      artists: artists,
      albums: albums,
      tracks: tracks,
      playlists: playlists
    };
  }

  matchingPartialByArtist(scrappyWord) {
    const artists = this.artists.filter(artist => artist.matchingByName(scrappyWord));
    return artists;
  }

  matchingPartialByAlbum(scrappyWord) {
    const albums = this.artists.reduce((total, current) => {
      const albumsMatch = current.matchingAlbumByName(scrappyWord);
      return total.concat(albumsMatch);
    }, []);
    return albums;
  }

  matchingPartialByTrack(scrappyWord) {
    const tracks = this.artists.reduce((total, current) => {
      const tracksMatch = current.matchingTrackByName(scrappyWord);
      return total.concat(tracksMatch);
    }, []);
    return tracks;
  }

  matchingPartialByPlaylist(scrappyWord) {
    const playlists = this.playlists.filter(playlist => playlist.matchingTrackByName(scrappyWord));
    return playlists;
  }

  // genres: array de generos(strings)
  // retorna: los tracks que contenga alguno de los generos en el parametro genres
  getTracksMatchingGenres(genres) {
    return this.getTracks().filter(elem=> elem.anyGenre(genres));
  }

  // artistName: nombre de artista(string)
  // retorna: los tracks interpredatos por el artista con nombre artistName
  getTracksMatchingArtist(artistName) { //TODO manejar caso donde no existe el artista
    const artist = this.artists.find(art => art.name === artistName);
    const albumsOfArtist = artist.albums;
    const tracks = albumsOfArtist.map(elem => elem.tracks).reduce((actual,elem) => actual.concat(elem));
    return tracks;
  }

  // name: nombre de la playlist
  // genresToInclude: array de generos
  // maxDuration: duración en segundos
  // retorna: la nueva playlist creada
  /*** Crea una playlist y la agrega a unqfy. ***
    El objeto playlist creado debe soportar (al menos):
      * una propiedad name (string)
      * un metodo duration() que retorne la duración de la playlist.
      * un metodo hasTrack(aTrack) que retorna true si aTrack se encuentra en la playlist.
  */
  createPlaylist(name, genresToInclude, maxDuration) {
    const currentId = this.id2Playlist++;
    const playlist = new Playlist(currentId, name, genresToInclude, maxDuration);
    
    const tracks = this.getTracksMatchingGenres(playlist.genresToInclude);
    const tracksWithMaxDuration = tracks.filter(track => track.isMaxDuration(maxDuration));
    playlist.addFullTracks(tracksWithMaxDuration);
    
    this.addNewPlaylist(playlist);

    return playlist;
  }

  addNewPlaylist(playlist) {
    this.playlists.push(playlist);
  }

  getPlaylistById(id) {
    const playlist = this.playlists.find(artist => artist.id === id); 
    return playlist !== undefined ? playlist : unqfyExceptions.PlaylistWithAlbumIdNotExist(`The Playlist with id ${id} does not exist`);
  }

  haveArtistName(name) {
    return this.artists.some(art => art.name === name);
  }

  save(filename) {
    const serializedData = picklify.picklify(this);
    fs.writeFileSync(filename, JSON.stringify(serializedData, null, 2));
  }

  static load(filename) {
    const serializedData = fs.readFileSync(filename, {encoding: 'utf-8'});
    //COMPLETAR POR EL ALUMNO: Agregar a la lista todas las clases que necesitan ser instanciadas
    const classes = [UNQfy, Artist, Album, Playlist, Track,User];
    return picklify.unpicklify(JSON.parse(serializedData), classes);
  }
}


// COMPLETAR POR EL ALUMNO: exportar todas las clases que necesiten ser utilizadas desde un modulo cliente
module.exports = {
  UNQfy: UNQfy,
};

