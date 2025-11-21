const express = require('express');
const { Usuario, Empresa } = require('../db');

const router = express.Router();

// GET all users (public)
router.get('/users', async (req, res) => {
    try {
        const users = await Usuario.findAll({
            attributes: ['id', 'nome', 'foto'], // Only retrieve necessary attributes
            order: [['nome', 'ASC']] // Order by name for consistency
        });
        res.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Erro ao buscar usuários.' });
    }
});

// GET company-wide metrics (public)
router.get('/company-metrics', async (req, res) => {
    try {
        // Assuming there's only one Empresa entry with id 1
        const company = await Empresa.findByPk(1, {
            attributes: ['totalAtividades', 'totalCalorias', 'logo', 'nome'] // Also include logo and name for general display
        });

        if (!company) {
            return res.status(404).json({ error: 'Dados da empresa não encontrados.' });
        }

        res.json({
            totalAtividades: company.totalAtividades,
            totalCalorias: company.totalCalorias,
            nome: company.nome,
            logo: company.logo
        });
    } catch (error) {
        console.error('Error fetching company metrics:', error);
        res.status(500).json({ error: 'Erro ao buscar métricas da empresa.' });
    }
});

module.exports = router;
