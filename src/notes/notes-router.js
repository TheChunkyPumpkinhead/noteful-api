const path = require('path');
const express = require('express');
const xss = require('xss');

const NotesService = require('./notes-service');

const NotesRouter = express.Router();
const jsonParser = express.json();

const serializeNote = note => ({
  id: note.id,
  date_published: note.date_published,
  title: xss(note.title),
  content: xss(note.content),
folder_id: note.folder_id
});

NotesRouter
  .route('/')
  .get((req, res, next) => {

    const knexInstance = req.app.get('db');
    NotesService.getAllNotes(knexInstance)
      .then(notes => {
        res.json(notes.map(serializeNote));
      })
      .catch(next);
  })
  .post(jsonParser, (req, res, next) => {
    const { title, content, folder_id} = req.body;
    const newNote = { title, content, folder_id };

    for (const [key, value] of Object.entries(newNote))
      if (value == null)
        return res.status(400).json({
          error: { message: `Missing '${key}' in request body` }
        });

    NotesService.insertNote(
      req.app.get('db'),
      newNote
    )
      .then(notes => {
        console.log('req.originalUrl', req.originalUrl);
        res
          .status(201)
          .location(path.posix.join(req.originalUrl, `/${notes.id}`))
          .json(serializeNote(notes));
      })
      .catch(next);
  });

NotesRouter
  .route('/:note_id')
  .all((req, res, next) => {
    const { note_id } = req.params;
    const knexInstance = req.app.get('db');
    NotesService.getById(knexInstance, note_id)
      .then(note => {
        if (!note) {
          return res.status(404).json({
            error: { message: `Note Not Found` }
          });
        }
        res.note = note;
        next();
      })
      .catch(next);
  })
  .get((req, res, next) => {
    res.json(serializeNote(res.note));
  })
  .delete((req, res, next) => {
    const { note_id } = req.params;
    const knexInstance = req.app.get('db');
    NotesService.deleteNote(knexInstance, note_id)
      .then(numRowsAffected => {
        res.status(204).end;
      })
      .catch(next);
  })
  .patch(jsonParser, (req, res, next) => {
    const { title } = req.body;
    const noteToUpdate = { title };

    const numberOfValues = Object.values(noteToUpdate).filter(Boolean).length;
    if (numberOfValues === 0)
      return res.status(400).json({
        error: {
          message: `Request body must contain either, 'title'`
        }
      });

    NotesService.updateNote(
      req.app.get('db'),
      req.params.note_id,
      noteToUpdate
    )
      .then(numRowsAffected => {
        console.log('numrows affected', numRowsAffected);
        res.status(204).end();
      })
      .catch(next);
  });




module.exports = NotesRouter;