const jwt = require('jsonwebtoken');

exports.identification = (req, res, next) => {
    let token;
    if (req.headers.client === 'not-browser') {
        token = req.headers.authorization;
    } else {
        token = req.cookies['Authorization'];
    }
    if (!token) {
        return res.status(401).json({ message: 'Authentication failed!' });
    }

    try {
        const userToken = token.split(' ')[1];
        const jwtVerified = jwt.verify(userToken, process.env.JWT_SECRET);
        if(jwtVerified) {
            req.user = jwtVerified;
            next();
        } else {
            throw new Error('Token verification failed');
        }
    } catch (error) {
        return res.status(401).json({ message: 'Invalid token!' });
    }
}