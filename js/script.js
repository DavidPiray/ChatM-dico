// Variable global para almacenar los mensajes del chat
let chatMessages = [];

// Variables para almacenar los datos de las bases de conocimiento
let enfermedades = [];
let medicos = [];
let nombres = [];
let ciudades = [];

// Manejo de información de las bases de conocimiento
fetch('../data/enfermedades.json')
    .then(response => response.json())
    .then(data => { enfermedades = data; });

fetch('../data/medicos.json')
    .then(response => response.json())
    .then(data => { medicos = data; });

fetch('../data/nombres.json')
    .then(response => response.json())
    .then(data => { nombres = data; });

fetch('../data/ciudades.json')
    .then(response => response.json())
    .then(data => { ciudades = data; });

// Manejo del clic en el botón de enviar
document.getElementById('sendBtn').addEventListener('click', async function (event) {
    event.preventDefault(); // Evita la recarga de la página al enviar el formulario

    var userInput = document.getElementById('userInput').value;
    if (userInput.trim() === '') {
        return;
    }

    var chatBox = document.getElementById('chatBox');
    var userMessage = document.createElement('div');
    userMessage.textContent = 'Tú: ' + userInput;
    userMessage.style.marginBottom = '20px'; // Espacio entre mensajes
    chatBox.appendChild(userMessage);

    var possibleDiseases = getDiagnosis(userInput);
    let botResponseText;

    if (Array.isArray(possibleDiseases)) {
        botResponseText = 'Podría tener: ' + possibleDiseases.map(disease => disease.nombre).join(', ');
        var botResponse = document.createElement('div');
        botResponse.textContent = 'Chatbot: ' + botResponseText;
        botResponse.style.marginBottom = '10px'; // Espacio entre mensajes
        chatBox.appendChild(botResponse);

        // Control de ingreso Ciudad
        let city = prompt('¿En qué ciudad se encuentra?');
        if (!ciudades.includes(city)) {
            let errorMessage = 'La ciudad ingresada no existe en Ecuador, por lo que no se ha podido recomendar ningún médico.';
            var errorResponse = document.createElement('div');
            errorResponse.textContent = 'Chatbot: ' + errorMessage;
            errorResponse.style.marginBottom = '10px'; // Espacio entre mensajes
            chatBox.appendChild(errorResponse);
            document.getElementById('userInput').value = '';
            chatBox.scrollTop = chatBox.scrollHeight;
            chatMessages.push({ user: userInput, bot: botResponseText, diseases: possibleDiseases});
            return;
        }

        // Para la lista de Doctores
        let doctors = suggestDoctors(possibleDiseases[0], city);
        let doctorMessages = [];

        if (Array.isArray(doctors) && doctors.length > 0) {
            doctorMessages.push(`Los siguientes especialistas están disponibles en ${city}:`);
            doctors.forEach(doc => {
                doctorMessages.push(`${doc.nombres}, Email: ${doc.correo}, Teléfono: ${doc.celular}`);
            });
        } else {
            const added = await addDoctor(city, possibleDiseases[0].especialista);
            if (added) {
                doctors = suggestDoctors(possibleDiseases[0], city);
                doctorMessages.push(`Los siguientes especialistas están disponibles en ${city}:`);
                doctors.forEach(doc => {
                    doctorMessages.push(`${doc.nombres}, Email: ${doc.correo}, Teléfono: ${doc.celular}`);
                });
            } else {
                doctorMessages.push('No se encontraron especialistas sugeridos.');
            }
        }

        // Mostrar los especialistas
        if (doctorMessages.length > 0) {
            doctorMessages.forEach(msg => {
                var doctorResponse = document.createElement('div');
                doctorResponse.textContent = 'Chatbot: ' + msg;
                doctorResponse.style.marginBottom = '10px'; // Espacio entre mensajes
                chatBox.appendChild(doctorResponse);
                document.getElementById('userInput').value = '';
                chatBox.scrollTop = chatBox.scrollHeight;
            });
        }

        chatMessages.push({ user: userInput, bot: botResponseText, diseases: possibleDiseases, city: city, doctors: doctors });

    } else {
        botResponseText = possibleDiseases;
        var botResponse = document.createElement('div');
        botResponse.textContent = 'Chatbot: ' + botResponseText;
        botResponse.style.marginBottom = '20px'; // Espacio entre mensajes
        chatBox.appendChild(botResponse);
        document.getElementById('userInput').value = '';
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    document.getElementById('userInput').value = '';
    chatBox.scrollTop = chatBox.scrollHeight;
    
    event.preventDefault(); // Evita la recarga de la página al enviar el formulario
});


// Función para sugerir médicos
function suggestDoctors(disease, city) {
    let relevantDoctors = medicos.filter(doctor =>
        doctor.especialidad.toLowerCase() === disease.especialista.toLowerCase() &&
        doctor.ciudad.toLowerCase() === city.toLowerCase()
    );

    return relevantDoctors;
}

// Función para obtener un diagnóstico basado en los síntomas
function getDiagnosis(symptomsInput) {
    let normalizedInput = symptomsInput.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "");
    let inputSymptoms = normalizedInput.split(' ').map(symptom => symptom.trim());

    let possibleDiseases = [];

    enfermedades.forEach(disease => {
        let matchedSymptoms = 0;
        let totalSymptoms = disease.sintomas_comunes.length;

        disease.sintomas_comunes.forEach(diseaseSymptom => {
            let normalizedDiseaseSymptom = diseaseSymptom.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "").trim();
            if (normalizedInput.includes(normalizedDiseaseSymptom)) {
                matchedSymptoms++;
            }
        });

        if (matchedSymptoms / totalSymptoms > 0.5) {
            possibleDiseases.push(disease);
        }
    });

    if (possibleDiseases.length > 0) {
        return possibleDiseases;
    } else {
        return 'No se pudo determinar una enfermedad en nuestra base de conocimientos basada en los síntomas proporcionados.';
    }
}

function generateRandomName() {
    return nombres[Math.floor(Math.random() * nombres.length)];
}

// Función para agregar un nuevo médico
function addDoctor(city, specialist) {
    let doctorName = generateRandomName();
    let email = doctorName.split(' ').join('.').toLowerCase() + '@gmail.com';
    let phoneNumber = '09' + Math.floor(Math.random() * 1000000000).toString();

    let newDoctor = {
        nombres: doctorName,
        especialidad: specialist,
        correo: email,
        celular: phoneNumber,
        ciudad: city
    };

    // Enviar el nuevo doctor al servidor
    return fetch('http://localhost:3000/update-medicos', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(newDoctor)
    })
        .then(response => {
            // Verifica si la respuesta es 2xx
            if (response.ok) {
                return response.json(); // Cambia a json() si la respuesta es JSON
            } else {
                throw new Error('Error en la solicitud: ' + response.status);
            }
        })
        .then(data => {
            // Verifica el contenido de la respuesta
            if (data.message === 'Médico añadido correctamente') {
                console.log('Médico añadido correctamente');
                //alert('Médico añadido correctamente');
                return true;
            } else {
                console.error('Error al guardar la base de datos de médicos:', data.error);
                alert('Error al guardar la base de datos de médicos.');
                return false;
            }
        })
        .catch(error => {
            console.error('Error al realizar la solicitud:', error);
            alert('Error al realizar la solicitud.');
            return false;
        });
}



// Maneja el clic en el botón de generar informe
document.querySelector('.report-button').addEventListener('click', generateReport);

function generateReport() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const margin = 15;
    const lineHeight = 8;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const maxWidth = pageWidth - 2 * margin;
    const watermarkImage = new Image();

    function addText(text, x, y, fontSize) {
        doc.setFontSize(fontSize);
        const splitText = doc.splitTextToSize(text, maxWidth);
        splitText.forEach((line, index) => {
            if (y + lineHeight > pageHeight - margin) {
                doc.addPage();
                y = margin;
            }
            doc.text(line, x + margin, y + margin);
            y += lineHeight;
        });
        return y;
    }

    function drawMarginLine(y) {
        doc.setLineWidth(0.5);
        doc.line(margin, y, pageWidth - margin, y);
    }

    // Generar contenido
    doc.setFontSize(20);
    let y = margin;
    y = addText('Informe del Chatbot de Diagnóstico de Enfermedades', 0, y, 18);

    y += 10;
    drawMarginLine(y);

    chatMessages.forEach((msg, index) => {
        if (msg.diseases) {
            y += 10;
            doc.setFontSize(20);
            y = addText(`- Diagnóstico:`, 0, y, 17);
            y = addText(`  ${msg.diseases.map(d => d.nombre).join(', ')}`, 0, y, 17);
            y += 10;
            y = addText(`- Descripción de Enfermedades:`, 0, y, 17);

            doc.setFontSize(20);
            msg.diseases.forEach(disease => {
                y = addText(`  ${disease.nombre}:`, 0, y, 17);
                y = addText(`    Descripción: ${disease.descripcion}`, 10, y, 17);
                y = addText(`    Síntomas: ${disease.sintomas_comunes.join(', ')}`, 10, y, 17);
                y = addText(`    Posibles causas: ${disease.posibles_causas.join(', ')}`, 10, y, 17);
                y = addText(`    Cómo evitarlo: ${disease.como_evitarlo.join(', ')}`, 10, y, 17);
                y = addText(`    Especialista: ${disease.especialista}`, 10, y, 17);
                y += lineHeight;
            });

            y = addText(`- Ciudad: ${msg.city}`, 0, y, 17);
            y += lineHeight;

            if (msg.doctors && msg.doctors.length > 0) {
                doc.setFontSize(20);
                y = addText('- Especialistas sugeridos:', 0, y, 17);
                msg.doctors.forEach(doctor => {
                    y = addText(`  Nombre: ${doctor.nombres}`, 0, y, 17);
                    y = addText(`  Email: ${doctor.correo}`, 0, y, 17);
                    y = addText(`  Teléfono: ${doctor.celular}`, 0, y, 17);
                    y += lineHeight;
                });
            } else {
                y = addText('No se encontraron especialistas sugeridos.', 0, y, 17);
            }
        }

        y += 10;
        drawMarginLine(y);
    });

    // Fecha en la parte inferior
    doc.setFontSize(17);
    doc.text(`Fecha: ${new Date().toLocaleDateString()}`, margin, pageHeight - margin - 10);

    doc.save('informe_chatbot.pdf');
}
