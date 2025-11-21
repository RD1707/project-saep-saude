const express = require('express');
const { Comentario, Usuario, Atividade } = require('../db');
const authenticateToken = require('../middleware/auth');

const router = express.Router();

// Create a comment for an activity
router.post('/:activityId/comments', authenticateToken, async (req, res) => {
    const { activityId } = req.params;
    const { texto } = req.body;
    const UsuarioId = req.user.id;

    if (!texto || texto.trim().length <= 2) {
        return res.status(400).json({ error: 'não é possível enviar um comentário vazio' });
    }

    try {
        const atividade = await Atividade.findByPk(activityId);
        if (!atividade) {
            return res.status(404).json({ error: 'Atividade não encontrada.' });
        }

        const comentario = await Comentario.create({
            texto,
            UsuarioId,
            AtividadeId: activityId,
        });

        // Increment comment counter for the activity
        await Atividade.increment('contadorComentarios', { by: 1, where: { id: activityId } });

        res.status(201).json(comentario);
    } catch (error) {
        console.error('Error creating comment:', error);
        res.status(500).json({ error: 'Erro ao criar comentário.' });
    }
});

// List comments for an activity
router.get('/:activityId/comments', authenticateToken, async (req, res) => {
    const { activityId } = req.params;

    try {
        const atividade = await Atividade.findByPk(activityId);
        if (!atividade) {
            return res.status(404).json({ error: 'Atividade não encontrada.' });
        }

        const comments = await Comentario.findAll({
            where: { AtividadeId: activityId },
            include: [
                {
                    model: Usuario,
                    attributes: ['id', 'nome', 'foto'],
                },
            ],
            order: [['dataCriacao', 'DESC']],
        });

        res.json(comments);
    } catch (error) {
        console.error('Error fetching comments:', error);
        res.status(500).json({ error: 'Erro ao buscar comentários.' });
    }
});

module.exports = router;
