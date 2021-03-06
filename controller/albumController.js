const fs = require('fs'); // necesitado para guardar/cargar unqfy
const unqmod = require('../unqfy'); // importamos el modulo unqfy
const express = require('express');
const errorsAPI = require("../exceptions/apiExeptions");
const {ArtistIdDoesNotExist} = require("../exceptions/artistException");
const router = express.Router();

function getUNQfy(filename = 'data.json') {
    let unqfy = new unqmod.UNQfy();
    if (fs.existsSync(filename)) {
      unqfy = unqmod.UNQfy.load(filename);
    }
    return unqfy;
}

const unqfy = getUNQfy();

router.post("/",(req,res)=>{
    const body = req.body;
    const idArtist = Number(body.artistId);
    let requestUnqfy = req.requestUnqfy;
    if(body.artistId && body.year && body.name){
        try {
            const album = requestUnqfy.addAlbum(idArtist,{name:body.name,year:body.year});
            requestUnqfy.save('data.json');
            res.status(201);
            res.json(album.toJSON());
        } catch (error) {
            if(error instanceof ArtistIdDoesNotExist){
                throw new errorsAPI.RelatedSourceNotFound();
            }else{
                throw new errorsAPI.AlreadyExists();
            }
        }
    }else{
        throw new errorsAPI.JSONException();
    }
});

router.get("/",(req, res) => {
    const name = req.query.name;
    let requestUnqfy = req.requestUnqfy;
    if(name){
        res.status(200).json(requestUnqfy.matchingPartialByAlbum(name));    
    }else{
        res.status(200).json(requestUnqfy.getAlbums());
    }
});

router.get("/:id",(req,res) =>{
    const idAlbum = Number(req.params.id);
    let requestUnqfy = req.requestUnqfy;
    try {
        const album = requestUnqfy.getAlbumById(idAlbum);
        res.status(200);
        res.json(album);
    } catch (error) {
        throw new errorsAPI.NotFound();
        
    }
});

router.patch("/:id",(req, res) => {
    const idAlbum = Number(req.params.id);
    const body = req.body;
    let requestUnqfy = req.requestUnqfy;
    if((body.year)){
        try{
            const album =requestUnqfy.getAlbumById(idAlbum);
            album.update(body.year);
            requestUnqfy.save('data.json');
            res.status(200).json(album);    
        }catch(error){
            throw new errorsAPI.NotFound();
        }
    }else{
        throw new errorsAPI.JSONException();
    }
});

router.delete("/:id",(req,res) =>{
    const idAlbum = Number(req.params.id);
    let requestUnqfy = req.requestUnqfy;
    try{
        let album = requestUnqfy.getAlbumById(idAlbum);
        requestUnqfy.removeAlbum(album.artist,idAlbum);
        requestUnqfy.save('data.json');
        res.status(204);
        res.json({message:"Album borrado correctamente"});
    }catch(error){
        throw new errorsAPI.NotFound();
    }
});

module.exports = router;