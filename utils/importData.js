const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse');
const bcrypt = require('bcryptjs');
const { Empresa, Usuario, Atividade } = require('../db');

const importInitialData = async () => {
    // ---------------------------------------------------------
    // 1. Importar Usuários
    // ---------------------------------------------------------
    const usuariosFilePath = path.join(__dirname, '../assets/arquivos_CSV/usuario.csv');
    const usuariosData = [];

    await new Promise((resolve, reject) => {
        fs.createReadStream(usuariosFilePath)
            .pipe(parse({
                columns: true,
                skip_empty_lines: true,
                delimiter: ',' // Correção: O CSV usa vírgula
            }))
            .on('data', (data) => usuariosData.push(data))
            .on('end', async () => {
                console.log('CSV de usuários lido. Importando...');
                for (const userData of usuariosData) {
                    try {
                        await Usuario.create({
                            // Mapeamento corrigido conforme o cabeçalho do CSV (id, nome, email, imagem...)
                            id: userData.id, 
                            nome: userData.nome,
                            email: userData.email,
                            senha: userData.senha, 
                            foto: userData.imagem, // CSV usa 'imagem', Modelo usa 'foto'
                            tipo: 'user',
                        }, { ignoreDuplicates: true });
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

    // ---------------------------------------------------------
    // 2. Importar Atividades
    // ---------------------------------------------------------
    const atividadesFilePath = path.join(__dirname, '../assets/arquivos_CSV/atividade.csv');
    const atividadesData = [];
    let totalCaloriasEmpresa = 0;
    let totalAtividadesEmpresa = 0;

    await new Promise((resolve, reject) => {
        fs.createReadStream(atividadesFilePath)
            .pipe(parse({
                columns: true,
                skip_empty_lines: true,
                delimiter: ',' // Correção: Mudado de ';' para ',' para corresponder ao arquivo
            }))
            .on('data', (data) => atividadesData.push(data))
            .on('end', async () => {
                console.log('CSV de atividades lido. Importando...');
                for (const atividadeData of atividadesData) {
                    try {
                        // O CSV usa 'usuario_id', não 'id_usuario'
                        const usuarioId = atividadeData.usuario_id;
                        const usuario = await Usuario.findByPk(usuarioId);

                        if (!usuario) {
                            console.warn(`Usuário com ID ${usuarioId} não encontrado para a atividade. Ignorando.`);
                            continue;
                        }

                        // Mapeamento corrigido conforme cabeçalhos do CSV
                        const novaAtividade = await Atividade.create({
                            id: atividadeData.id, // CSV usa 'id'
                            tipo: atividadeData.tipo_atividade,
                            titulo: atividadeData.tipo_atividade, // CSV não tem titulo, usamos o tipo
                            distanciaMetros: parseFloat(atividadeData.distancia_percorrida), // CSV usa 'distancia_percorrida'
                            duracaoMinutos: parseFloat(atividadeData.duracao_atividade),     // CSV usa 'duracao_atividade'
                            calorias: parseFloat(atividadeData.quantidade_calorias),         // CSV usa 'quantidade_calorias'
                            dataCriacao: new Date(atividadeData.createdAt), // CSV usa 'createdAt'
                            UsuarioId: usuario.id,
                        });

                        // Atualizar métricas do usuário
                        usuario.totalAtividades = (usuario.totalAtividades || 0) + 1;
                        usuario.totalCalorias = (usuario.totalCalorias || 0) + novaAtividade.calorias;
                        await usuario.save();

                        // Métricas da empresa
                        totalAtividadesEmpresa++;
                        totalCaloriasEmpresa += novaAtividade.calorias;

                    } catch (error) {
                        console.error('Erro ao importar atividade:', atividadeData, error.message);
                    }
                }
                console.log('Atividades importadas.');
                resolve();
            })
            .on('error', reject);
    });

    // ---------------------------------------------------------
    // 3. Atualizar Métricas da Empresa
    // ---------------------------------------------------------
    let empresa = await Empresa.findOne();
    if (!empresa) {
        empresa = await Empresa.create({
            nome: 'SAEPSaude',
            logo: 'SAEPSaude.png',
            totalAtividades: totalAtividadesEmpresa,
            totalCalorias: totalCaloriasEmpresa,
        });
    } else {
        // Se já existir, somamos aos valores existentes ou redefinimos
        // Como é importação inicial, vamos assumir que queremos atualizar os totais
        empresa.totalAtividades = totalAtividadesEmpresa;
        empresa.totalCalorias = totalCaloriasEmpresa;
        await empresa.save();
    }
    console.log('Métricas da empresa atualizadas.');
};

module.exports = { importInitialData };