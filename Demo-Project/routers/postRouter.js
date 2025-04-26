const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const { identification } = require('../middlewares/identification');

router.get('/all-post', identification, postController.getAllPosts);
router.get('/single-post', postController.singlePost);
router.post('/create-post', identification, postController.createPost);
router.put('/edit-post', identification, postController.editPost);
router.delete('/delete-post', identification, postController.deletePost);


module.exports = router;