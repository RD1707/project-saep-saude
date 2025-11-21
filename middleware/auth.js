const jwt = require('jsonwebtoken');
const { Usuario } = require('../db');

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) {
        return res.status(401).json({ error: 'Token não fornecido.' });
    }

    jwt.verify(token, process.env.JWT_SECRET, async (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Token inválido.' });
        }
        
        req.user = await Usuario.findByPk(user.id);
        if (!req.user) {
            return res.status(404).json({ error: 'Usuário não encontrado.' });
        }
        next();
    });
};

module.exports = authenticateToken;
