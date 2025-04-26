const { createPostSchema } = require("../middlewares/validator");
const Post = require("../models/postsModel");

/**
 * @swagger
 * /posts:
 *   get:
 *     summary: Get all posts
 *     description: Retrieve a paginated list of posts.
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number for pagination
 *     responses:
 *       200:
 *         description: Posts fetched successfully
 *       500:
 *         description: Internal server error
 */
exports.getAllPosts = async (req, res) => {
    const { page } = req.query;
    const postsPerPage = 10;
    try {
        let pageNum = 0;
        if (page <= 1) {
            pageNum = 0;
        } else {
            pageNum = (page - 1);
        }
        const result = await Post.find().sort({ createdAt: -1 }).skip(pageNum * postsPerPage).limit(postsPerPage).populate({
            path: 'userId',
            select: 'name email'
        });
        res.status(200).json({
            message: 'Posts fetched successfully',
            posts: result,
        });
    } catch (error) {
        console.error('Error fetching posts:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

/**
 * @swagger
 * /posts/single:
 *   get:
 *     summary: Get a single post
 *     description: Retrieve a single post by its ID.
 *     parameters:
 *       - in: query
 *         name: _id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the post
 *     responses:
 *       200:
 *         description: Get single post successfully
 *       404:
 *         description: Post not found
 *       500:
 *         description: Internal server error
 */
exports.singlePost = async (req, res) => {
    const { _id } = req.query;
    try {
        const result = await Post.findOne({ _id }).populate({
            path: 'userId',
            select: 'name email'
        });
        res.status(200).json({
            message: 'Get single post successfully',
            posts: result,
        });
    } catch (error) {
        console.error('Error fetching posts:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

/**
 * @swagger
 * /posts:
 *   post:
 *     summary: Create a new post
 *     description: Create a new post with a title and description.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Post created successfully
 *       401:
 *         description: Validation error
 *       500:
 *         description: Internal server error
 */
exports.createPost = async (req, res) => {
    const { title, description } = req.body;
    const userId = req.user.id;
    try {
        const { error, value } = createPostSchema.validate({ title, description, userId });
        if (error) {
            return res.status(401).json({ message: error.details[0].message });
        }
        const newPost = await Post.create({
            title,
            description,
            userId
        });
        res.status(201).json({
            message: 'Post created successfully',
            post: newPost,
        });
    } catch (error) {
        console.error('Error creating post:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

/**
 * @swagger
 * /posts:
 *   put:
 *     summary: Edit a post
 *     description: Edit an existing post by its ID.
 *     parameters:
 *       - in: query
 *         name: _id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the post
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Post updated successfully
 *       403:
 *         description: Unauthorized to edit this post
 *       404:
 *         description: Post not found
 *       500:
 *         description: Internal server error
 */
exports.editPost = async (req, res) => {
    const { _id } = req.query;
    const { title, description } = req.body;
    const userId = req.user.id;
    try {
        const { error, value } = createPostSchema.validate({ title, description, userId });
        if (error) {
            return res.status(401).json({ message: error.details[0].message });
        }
        const existingPost = await Post.findOne({ _id });
        if (!existingPost) {
            return res.status(404).json({ message: 'Post not found' });
        }
        if (existingPost.userId.toString() !== userId) {
            return res.status(403).json({ message: 'You are not authorized to edit this post' });
        }
        existingPost.title = title;
        existingPost.description = description;
        const updatedPost = await existingPost.save();
        res.status(200).json({
            message: 'Post updated successfully',
            post: updatedPost,
        });
    } catch (error) {
        console.error('Error updating post:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

/**
 * @swagger
 * /posts:
 *   delete:
 *     summary: Delete a post
 *     description: Delete an existing post by its ID.
 *     parameters:
 *       - in: query
 *         name: _id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the post
 *     responses:
 *       200:
 *         description: Post deleted successfully
 *       403:
 *         description: Unauthorized to delete this post
 *       404:
 *         description: Post not found
 *       500:
 *         description: Internal server error
 */
exports.deletePost = async (req, res) => {
    const { _id } = req.query;
    const userId = req.user.id;

    try {
        const result = await Post.findOne({ _id });
        if (!result) {
            return res.status(404).json({ message: 'Post not found' });
        }
        if (result.userId.toString() !== userId) {
            return res.status(403).json({ message: 'You are not authorized to delete this post' });
        }
        await Post.deleteOne({ _id });
        res.status(200).json({
            message: 'Post deleted successfully',
        });
    } catch (error) {
        console.error('Error deleting post:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};