const express = require('express');
const router = express.Router();
const authmiddleware = require('../middleware/auth');
const documentController = require('../controller/document.controller');

router.post('/', authmiddleware, documentController.createDocument);
router.get('/', authmiddleware, documentController.getDocuments);
router.get('/:id', authmiddleware, documentController.getDocumentById);
router.put('/:id', authmiddleware, documentController.updateDocument);
router.delete('/:id', authmiddleware, documentController.deleteDocument);
router.post('/:id/collaborators', authmiddleware, documentController.addCollaborator);
router.delete('/:id/collaborators/:userId', authmiddleware, documentController.removeCollaborator);
router.get('/:id/versions', authmiddleware, documentController.getDocumentVersions);


module.exports = router;
