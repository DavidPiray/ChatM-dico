const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors'); // Importa el paquete cors
const app = express();
const port = 3000;

// Middleware para permitir CORS
app.use(cors());

// Middleware para parsear JSON
app.use(express.json());

// Ruta para guardar datos de médicos
app.post('/update-medicos', (req, res) => {
    const newDoctor = req.body;

    // Construir la ruta del archivo de forma segura
    const filePath = path.join(__dirname, 'data', 'medicos.json');

    // Leer el archivo JSON existente
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error al leer el archivo:', err);
            return res.status(500).json({ error: 'Error interno del servidor' });
        }

        // Parsear los datos existentes y añadir el nuevo médico
        let medicos;
        try {
            medicos = JSON.parse(data);
        } catch (parseErr) {
            console.error('Error al parsear el archivo JSON:', parseErr);
            return res.status(500).json({ error: 'Error interno del servidor' });
        }
        
        medicos.push(newDoctor);

        // Guardar los datos actualizados en el archivo
        fs.writeFile(filePath, JSON.stringify(medicos, null, 2), 'utf8', (err) => {
            if (err) {
                console.error('Error al guardar el archivo:', err);
                return res.status(500).json({ error: 'Error interno del servidor' });
            }

            res.status(200).json({ message: 'Médico añadido correctamente' });
        });
    });
});


app.listen(port, () => {
    console.log(`Servidor escuchando en http://localhost:${port}`);
});
