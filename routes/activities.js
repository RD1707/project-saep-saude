const express = require('express');
const { Op } = require('sequelize');
const { Atividade, Usuario, Like, Empresa, Comentario, sequelize } = require('../db');
const authenticateToken = require('../middleware/auth');

const router = express.Router();

// Create Activity
router.post('/', authenticateToken, async (req, res) => {
    const { tipo, titulo, distanciaMetros, duracaoMinutos, calorias } = req.body;
    const UsuarioId = req.user.id;

    if (!tipo || !titulo || distanciaMetros === undefined || duracaoMinutos === undefined || calorias === undefined) {
        return res.status(400).json({ error: 'Campo obrigatório' });
    }

    try {
        const atividade = await Atividade.create({
            tipo,
            titulo,
            distanciaMetros,
            duracaoMinutos,
            calorias,
            UsuarioId,
        });

        // Update user's metrics
        await Usuario.increment({ totalAtividades: 1, totalCalorias: calorias }, { where: { id: UsuarioId } });

        // Update company's metrics
        await Empresa.increment({ totalAtividades: 1, totalCalorias: calorias }, { where: { id: 1 } }); // Assuming Empresa has id 1

        res.status(201).json(atividade);
    } catch (error) {
        console.error('Error creating activity:', error);
        res.status(500).json({ error: 'Erro ao criar atividade.' });
    }
});

// List Activities with pagination and filters
router.get('/', authenticateToken, async (req, res) => {
    const { page = 1, limit = 10, tipo } = req.query;
    const offset = (page - 1) * limit;
    const userId = req.user.id;

    const whereClause = {};
    if (tipo) {
        whereClause.tipo = tipo;
    }

    try {
        const { count, rows } = await Atividade.findAndCountAll({
            where: whereClause,
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['dataCriacao', 'DESC']],
            include: [
                {
                    model: Usuario,
                    attributes: ['id', 'nome', 'foto'],
                },
            ],
        });

        const atividadesComLikes = await Promise.all(rows.map(async (atividade) => {
            const hasLiked = await Like.count({
                where: {
                    UsuarioId: userId,
                    AtividadeId: atividade.id,
                },
            }) > 0;

            return {
                ...atividade.toJSON(),
                hasLiked,
            };
        }));

        res.json({
            totalItems: count,
            totalPages: Math.ceil(count / limit),
            currentPage: parseInt(page),
            atividades: atividadesComLikes,
        });
    } catch (error) {
        console.error('Error listing activities:', error);
        res.status(500).json({ error: 'Erro ao listar atividades.' });
    }
});

// Toggle Like on an Activity
router.post('/:activityId/toggle-like', authenticateToken, async (req, res) => {
    const { activityId } = req.params;
    const UsuarioId = req.user.id;

    try {
        const atividade = await Atividade.findByPk(activityId);
        if (!atividade) {
            return res.status(404).json({ error: 'Atividade não encontrada.' });
        }

        const existingLike = await Like.findOne({
            where: {
                UsuarioId,
                AtividadeId: activityId,
            },
        });

        if (existingLike) {
            // Unlike
            await existingLike.destroy();
            await Atividade.decrement('contadorLikes', { by: 1, where: { id: activityId } });
            res.json({ liked: false, totalLikes: atividade.contadorLikes - 1 });
        } else {
            // Like
            await Like.create({ UsuarioId, AtividadeId: activityId });
            await Atividade.increment('contadorLikes', { by: 1, where: { id: activityId } });
            res.json({ liked: true, totalLikes: atividade.contadorLikes + 1 });
        }
    } catch (error) {
        console.error('Error toggling like:', error);
        res.status(500).json({ error: 'Erro ao alternar curtida.' });
    }
});

module.exports = router;
