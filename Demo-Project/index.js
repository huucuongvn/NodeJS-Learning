const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const { swaggerUi, swaggerSpec } = require('./swagger');
const mongoose = require('mongoose');
const authRouter = require('./routers/authRouter');
const postRouter = require('./routers/postRouter');

const app = express();

app.use(cors())
app.use(helmet())
app.use(cookieParser())
app.use(express.json())
app.use(express.urlencoded({extended:true }))
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))

mongoose.connect(process.env.MONGO_URI).then(() => {
    console.log('Database connected');
}).catch((err) => {
    console.error('Database connection error:', err);
});

app.use('/api/auth', authRouter)
app.use('/api/posts', postRouter)

app.get('/', (req, res) => {
    res.json({
        message: 'Hello, World!'
    })
})

app.listen(process.env.PORT || 3000, () => {
    console.log(`Server is running on port ${process.env.PORT || 3000}`);
}
);