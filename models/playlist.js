class Playlist {
    constructor(id, name, genresToInclude, maxDuration) {
        this.id = id;
        this.name = name;
        this.genresToInclude = genresToInclude;
        this.maxDuration = maxDuration;
        this.tracks = [];
    }

    addFullTracks(tracksWithMaxDuration) {
        this.tracks = tracksWithMaxDuration;
        return this.tracks;
    }

    duration() {
    // * un metodo duration() que retorne la duración de la playlist.
        // return this.tracks.reduce((accumulator, current) => {
        //     return accumulator + current.duration
        // }, 0)
        return this.maxDuration;
    }

    hasTrack(aTrack) {
    // * un metodo hasTrack(aTrack) que retorna true si aTrack se encuentra en la playlist.
        const findTrack = this.tracks.find(track => (track.id === aTrack.id) && (track.name === aTrack.name));
        return findTrack !== undefined;
    }

    removeTrack(aTrack) {
        this.tracks = this.tracks.filter(track => (track.name !== aTrack.name) && (track.id !== aTrack.id));
        return this.tracks;
    }

    matchingTrackByName(scrappyWord) {
        const tracks = this.tracks.filter(track => track.matchingByName(scrappyWord));
        return tracks;
    }

    matchingTrackBy(name, durationLT, durationGT) {
        const tracks = this.tracks.filter(track => track.matchingBy(name, durationLT, durationGT))
        return tracks;
    }

    toJson() {
        return { id: this.id,
                 name: this.name,
                 duration: this.maxDuration,
                 tracks: this.tracks
                }
    }
}

module.exports = Playlist;