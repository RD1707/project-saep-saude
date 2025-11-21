const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse');
const bcrypt = require('bcryptjs');
const { Empresa, Usuario, Atividade } = require('../db');

const importInitialData = async () => {
    // Import Usuarios
    const usuariosFilePath = path.join(__dirname, '../assets/arquivos_CSV/usuario.csv');
    const usuariosData = [];
    await new Promise((resolve, reject) => {
        fs.createReadStream(usuariosFilePath)
            .pipe(parse({
                columns: true,
                skip_empty_lines: true,
                delimiter: ',' // Specify semicolon as delimiter
            }))
            .on('data', (data) => usuariosData.push(data))
            .on('end', async () => {
                console.log('CSV de usuários lido. Importando...');
                for (const userData of usuariosData) {
                    try {
                        await Usuario.create({
                            id: userData.id_usuario, // Ensure ID is mapped correctly
                            nome: userData.nome,
                            email: userData.email,
                            senha: userData.senha, // Password will be hashed by the model's beforeCreate hook
                            foto: userData.foto_perfil,
                            tipo: 'user', // Default type
                        }, { ignoreDuplicates: true }); // Ignore if user with same ID already exists
                    } catch (error) {
                        if (error.name === 'SequelizeUniqueConstraintError') {
                            console.warn(`Usuário com email ${userData.email} já existe. Ignorando.`);
                        } else {
                            console.error('Erro ao importar usuário:', userData, error.message);
                        }
                    }
                }
                console.log('Usuários importados.');
                resolve();
            })
            .on('error', reject);
    });

    // Import Atividades
    const atividadesFilePath = path.join(__dirname, '../assets/arquivos_CSV/atividade.csv');
    const atividadesData = [];
    let totalCaloriasEmpresa = 0;
    let totalAtividadesEmpresa = 0;

    await new Promise((resolve, reject) => {
        fs.createReadStream(atividadesFilePath)
            .pipe(parse({
                columns: true,
                skip_empty_lines: true,
                delimiter: ';' // Specify semicolon as delimiter
            }))
            .on('data', (data) => atividadesData.push(data))
            .on('end', async () => {
                console.log('CSV de atividades lido. Importando...');
                for (const atividadeData of atividadesData) {
                    try {
                        const usuario = await Usuario.findByPk(atividadeData.id_usuario);
                        if (!usuario) {
                            console.warn(`Usuário com ID ${atividadeData.id_usuario} não encontrado para atividade ${atividadeData.titulo}. Ignorando atividade.`);
                            continue;
                        }

                        const atividade = await Atividade.create({
                            id: atividadeData.id_atividade,
                            tipo: atividadeData.tipo_atividade,
                            titulo: atividadeData.titulo,
                            distanciaMetros: parseFloat(atividadeData.distancia),
                            duracaoMinutos: parseFloat(atividadeData.duracao),
                            calorias: parseFloat(atividadeData.calorias),
                            dataCriacao: new Date(atividadeData.data_criacao),
                            UsuarioId: usuario.id,
                        });

                        // Update user's total activities and calories
                        usuario.totalAtividades = (usuario.totalAtividades || 0) + 1;
                        usuario.totalCalorias = (usuario.totalCalorias || 0) + atividade.calorias;
                        await usuario.save();

                        totalAtividadesEmpresa++;
                        totalCaloriasEmpresa += atividade.calorias;

                    } catch (error) {
                        console.error('Erro ao importar atividade:', atividadeData, error.message);
                    }
                }
                console.log('Atividades importadas.');
                resolve();
            })
            .on('error', reject);
    });

    // Create or update Empresa metrics
    let empresa = await Empresa.findOne();
    if (!empresa) {
        empresa = await Empresa.create({
            nome: 'SAEPSaude',
            logo: 'SAEPSaude.png',
            totalAtividades: totalAtividadesEmpresa,
            totalCalorias: totalCaloriasEmpresa,
        });
    } else {
        empresa.totalAtividades = totalAtividadesEmpresa;
        empresa.totalCalorias = totalCaloriasEmpresa;
        await empresa.save();
    }
    console.log('Métricas da empresa atualizadas.');
};

module.exports = { importInitialData };
