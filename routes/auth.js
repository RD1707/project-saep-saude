const express = require('express');
const jwt = require('jsonwebtoken');
const { Usuario, Atividade } = require('../db');
const authenticateToken = require('../middleware/auth');

const router = express.Router();

// Login endpoint
router.post('/login', async (req, res) => {
    const { email, senha } = req.body;

    if (!email || !senha) {
        return res.status(400).json({ error: 'email ou senha obrigatório' });
    }

    const usuario = await Usuario.findOne({ where: { email } });

    if (!usuario || !(await usuario.validPassword(senha))) {
        return res.status(401).json({ error: 'email ou senha incorreta' });
    }

    const token = jwt.sign({ id: usuario.id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    // Calculate user's personal metrics
    const userActivities = await Atividade.findAll({ where: { UsuarioId: usuario.id } });
    const totalAtividades = userActivities.length;
    const totalCalorias = userActivities.reduce((sum, activity) => sum + activity.calorias, 0);

    // Update user's metrics in the database (optional, can be done on activity creation/deletion)
    // For now, let's just return them. If persistent, this needs to be saved to the user model.
    // usuario.totalAtividades = totalAtividades;
    // usuario.totalCalorias = totalCalorias;
    // await usuario.save();

    res.json({
        token,
        usuario: {
            id: usuario.id,
            nome: usuario.nome,
            email: usuario.email,
            foto: usuario.foto,
            tipo: usuario.tipo,
            totalAtividades: totalAtividades, // Return calculated metrics
            totalCalorias: totalCalorias,   // Return calculated metrics
        },
    });
});

// Get logged-in user info and personal metrics
router.get('/me', authenticateToken, async (req, res) => {
    // req.user is populated by the authenticateToken middleware
    const usuario = req.user;

    // Recalculate user's personal metrics to ensure they are up-to-date
    const userActivities = await Atividade.findAll({ where: { UsuarioId: usuario.id } });
    const totalAtividades = userActivities.length;
    const totalCalorias = userActivities.reduce((sum, activity) => sum + activity.calorias, 0);

    res.json({
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        foto: usuario.foto,
        tipo: usuario.tipo,
        totalAtividades: totalAtividades,
        totalCalorias: totalCalorias,
    });
});

module.exports = router;
