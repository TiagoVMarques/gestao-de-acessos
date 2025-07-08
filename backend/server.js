const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 4000;

// Configuração da conexão com a base de dados (usando variáveis de ambiente)
const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

const dbName = process.env.DB_NAME;
let pool;

// Função para inicializar a base de dados e as tabelas
async function initializeDatabase() {
    try {
        console.log('A conectar ao servidor MariaDB...');
        const tempConnection = await mysql.createConnection(dbConfig);
        console.log('Conectado ao servidor. A verificar/criar o schema...');
        await tempConnection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\`;`);
        await tempConnection.end();
        console.log(`Schema '${dbName}' verificado/criado com sucesso.`);

        pool = mysql.createPool({ ...dbConfig, database: dbName });
        const connection = await pool.getConnection();
        console.log('Pool de conexões estabelecido com a base de dados.');

        await connection.query(`
            CREATE TABLE IF NOT EXISTS software (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL UNIQUE
            );
        `);
        await connection.query(`
            CREATE TABLE IF NOT EXISTS employees (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL UNIQUE,
                department VARCHAR(255) NOT NULL,
                role VARCHAR(255) NOT NULL,
                manager VARCHAR(255)
            );
        `);
        await connection.query(`
            CREATE TABLE IF NOT EXISTS software_access (
                id INT AUTO_INCREMENT PRIMARY KEY,
                employee_id INT NOT NULL,
                software_id INT NOT NULL,
                access_level VARCHAR(50) NOT NULL,
                FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
                FOREIGN KEY (software_id) REFERENCES software(id),
                UNIQUE KEY (employee_id, software_id)
            );
        `);

        connection.release();
        console.log('Tabelas verificadas/criadas com sucesso.');

    } catch (error) {
        console.error('ERRO DE INICIALIZAÇÃO DA BASE DE DADOS:', error);
        throw error;
    }
}

// --- Rotas da API ---

app.get('/api/software', async (req, res) => {
    try {
        const [results] = await pool.query('SELECT * FROM software ORDER BY name');
        res.json(results);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/software', async (req, res) => {
    try {
        const { name } = req.body;
        const [result] = await pool.query('INSERT INTO software (name) VALUES (?)', [name]);
        res.status(201).json({ id: result.insertId, name });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.delete('/api/software/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM software WHERE id = ?', [req.params.id]);
        res.status(204).send();
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get('/api/employees', async (req, res) => {
    try {
        const [employees] = await pool.query('SELECT * FROM employees ORDER BY name');
        for (let emp of employees) {
            const [access] = await pool.query(
                'SELECT software_id as softwareId, access_level as level FROM software_access WHERE employee_id = ?',
                [emp.id]
            );
            emp.softwareAccess = access;
        }
        res.json(employees);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/employees', async (req, res) => {
    const { name, department, role, manager, softwareAccess } = req.body;
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const [result] = await connection.query(
            'INSERT INTO employees (name, department, role, manager) VALUES (?, ?, ?, ?)',
            [name, department, role, manager]
        );
        const employeeId = result.insertId;
        if (softwareAccess && softwareAccess.length > 0) {
            for (const access of softwareAccess) {
                await connection.query('INSERT INTO software_access (employee_id, software_id, access_level) VALUES (?, ?, ?)', [employeeId, access.softwareId, access.level]);
            }
        }
        await connection.commit();
        res.status(201).json({ id: employeeId, ...req.body });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ error: error.message });
    } finally {
        connection.release();
    }
});

app.put('/api/employees/:id', async (req, res) => {
    const { id } = req.params;
    const { name, department, role, manager, softwareAccess } = req.body;
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        await connection.query('UPDATE employees SET name = ?, department = ?, role = ?, manager = ? WHERE id = ?', [name, department, role, manager, id]);
        await connection.query('DELETE FROM software_access WHERE employee_id = ?', [id]);
        if (softwareAccess && softwareAccess.length > 0) {
            for (const access of softwareAccess) {
                await connection.query('INSERT INTO software_access (employee_id, software_id, access_level) VALUES (?, ?, ?)', [id, access.softwareId, access.level]);
            }
        }
        await connection.commit();
        res.json({ id, ...req.body });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ error: error.message });
    } finally {
        connection.release();
    }
});

app.delete('/api/employees/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM employees WHERE id = ?', [req.params.id]);
        res.status(204).send();
    } catch (error) { res.status(500).json({ error: error.message }); }
});

initializeDatabase().then(() => {
    app.listen(PORT, () => {
        console.log(`Servidor backend a rodar em http://localhost:${PORT}`);
    });
}).catch(err => {
    console.error('Falha ao iniciar o servidor. Verifique as credenciais da base de dados e a conectividade.', err);
    process.exit(1);
});
