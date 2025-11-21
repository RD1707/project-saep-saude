const { Sequelize, DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: './database.sqlite',
    logging: false, // Set to true to see SQL queries in console
});

const Empresa = sequelize.define('Empresa', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    nome: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    logo: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    totalAtividades: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    },
    totalCalorias: {
        type: DataTypes.FLOAT,
        defaultValue: 0,
    },
});

const Usuario = sequelize.define('Usuario', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    nome: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    senha: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    foto: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    tipo: {
        type: DataTypes.STRING,
        allowNull: false, // e.g., 'admin', 'user'
        defaultValue: 'user',
    },
    totalAtividades: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    },
    totalCalorias: {
        type: DataTypes.FLOAT,
        defaultValue: 0,
    },
});

Usuario.beforeCreate(async (usuario) => {
    if (usuario.senha) {
        usuario.senha = await bcrypt.hash(usuario.senha, 10);
    }
});

Usuario.prototype.validPassword = async function (password) {
    return bcrypt.compare(password, this.senha);
};

const Atividade = sequelize.define('Atividade', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    tipo: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    titulo: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    distanciaMetros: {
        type: DataTypes.FLOAT,
        allowNull: false,
    },
    duracaoMinutos: {
        type: DataTypes.FLOAT,
        allowNull: false,
    },
    calorias: {
        type: DataTypes.FLOAT,
        allowNull: false,
    },
    dataCriacao: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
    },
    contadorLikes: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    },
    contadorComentarios: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    },
});

const Like = sequelize.define('Like', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    dataCriacao: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
    },
}, {
    indexes: [
        {
            unique: true,
            fields: ['UsuarioId', 'AtividadeId']
        }
    ]
});

const Comentario = sequelize.define('Comentario', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    texto: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    dataCriacao: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
    },
});

// Associations
Usuario.hasMany(Atividade, { onDelete: 'CASCADE' });
Atividade.belongsTo(Usuario);

Usuario.hasMany(Like, { onDelete: 'CASCADE' });
Like.belongsTo(Usuario);

Atividade.hasMany(Like, { onDelete: 'CASCADE' });
Like.belongsTo(Atividade);

Usuario.hasMany(Comentario, { onDelete: 'CASCADE' });
Comentario.belongsTo(Usuario);

Atividade.hasMany(Comentario, { onDelete: 'CASCADE' });
Comentario.belongsTo(Atividade);

const syncDatabase = async () => {
    await sequelize.sync({ force: true }); // `force: true` will drop tables if they exist
    console.log('Database synced');
};

module.exports = {
    sequelize,
    Empresa,
    Usuario,
    Atividade,
    Like,
    Comentario,
    syncDatabase,
};
