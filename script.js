document.addEventListener('DOMContentLoaded', () => {
    let currentTopicIndex = -1;
    let points = parseInt(localStorage.getItem('mathPoints')) || 0;
    let fontSize = parseInt(localStorage.getItem('mathFontSize')) || 18;
    let isTtsActive = localStorage.getItem('ttsEnabled') !== 'false'; // Activado por defecto

    // Elementos DOM
    const subjectTitle = document.getElementById('subject-title');
    const topicsList = document.getElementById('topics-list');
    const topicTitle = document.getElementById('topic-title');
    const topicDescription = document.getElementById('topic-description');
    const conceptsArea = document.getElementById('concepts-area');
    const quizArea = document.getElementById('quiz-area');
    const quizQuestion = document.getElementById('quiz-question');
    const quizOptions = document.getElementById('quiz-options');
    const quizFeedback = document.getElementById('quiz-feedback');
    const pointsCounter = document.getElementById('points-counter');
    const levelDisplay = document.getElementById('level-display');
    const startReadingBtn = document.getElementById('start-reading');
    const ttsToggleBtn = document.getElementById('toggle-tts');

    // Inicializar directamente con los datos de data.js
    if (typeof contentData !== 'undefined') {
        initCartilla();
    } else {
        console.error('No se encontró contentData en data.js');
    }

    function initCartilla() {
        subjectTitle.textContent = contentData.subject;
        subjectTitle.setAttribute('tabindex', '0');
        updateProgress();
        renderTopicsMenu();
        applyFontSize();
        updateTtsUI();

        // Anuncio inicial al cargar el curso
        setTimeout(() => {
            if (isTtsActive) speakText(`Has ingresado al curso de ${contentData.subject}. ${contentData.welcome_message}`);
        }, 500);
    }

    // Lectura de elementos estáticos (títulos y descripciones)
    [subjectTitle, topicTitle, topicDescription].forEach(el => {
        el.setAttribute('tabindex', '0');
        el.addEventListener('mouseenter', () => { if (isTtsActive) speakText(el.textContent); });
        el.addEventListener('focus', () => { if (isTtsActive) speakText(el.textContent); });
    });

    function renderTopicsMenu() {
        topicsList.innerHTML = '';
        contentData.topics.forEach((topic, index) => {
            const li = document.createElement('li');
            const btn = document.createElement('button');
            btn.className = 'sidebar-btn';
            btn.textContent = `Tema ${topic.id}: ${topic.title}`;
            btn.setAttribute('aria-label', `Cargar tema ${topic.id}: ${topic.title}`);
            btn.onclick = () => loadTopic(index);

            // Añadir eventos para lectura al pasar cursor o foco
            btn.addEventListener('mouseenter', () => { if (isTtsActive) speakText(`Tema ${topic.id}: ${topic.title}`); });
            btn.addEventListener('focus', () => { if (isTtsActive) speakText(`Tema ${topic.id}: ${topic.title}`); });

            li.appendChild(btn);
            topicsList.appendChild(li);
        });
    }

    function loadTopic(index) {
        currentTopicIndex = index;
        const topic = contentData.topics[index];
        
        // Actualizar UI
        topicTitle.textContent = topic.title;
        topicDescription.textContent = topic.description;
        
        // Resaltar botón activo
        document.querySelectorAll('.sidebar-btn').forEach((btn, i) => {
            btn.classList.toggle('active', i === index);
        });

        // Cargar conceptos
        conceptsArea.innerHTML = '';
        topic.concepts.forEach(concept => {
            const card = document.createElement('div');
            card.className = 'concept-card';
            card.setAttribute('role', 'region');
            card.setAttribute('aria-label', 'Concepto clave');
            card.setAttribute('tabindex', '0');
            card.textContent = concept;
            
            card.addEventListener('mouseenter', () => { if (isTtsActive) speakText(concept); });
            card.addEventListener('focus', () => { if (isTtsActive) speakText(concept); });
            
            conceptsArea.appendChild(card);
        });

        // Cargar imagen si existe
        const imageArea = document.getElementById('image-area') || createImageArea();
        if (topic.image) {
            imageArea.innerHTML = `<img src="${topic.image.url}" alt="${topic.image.alt}" tabindex="0" class="topic-img">`;
            const img = imageArea.querySelector('img');
            img.addEventListener('mouseenter', () => { if (isTtsActive) speakText("Imagen: " + topic.image.alt); });
            img.addEventListener('focus', () => { if (isTtsActive) speakText("Imagen: " + topic.image.alt); });
            imageArea.hidden = false;
        } else {
            imageArea.hidden = true;
        }

        // Preparar Quiz
        quizArea.hidden = false;
        loadQuiz(topic.quiz[0]);

        topicTitle.focus();
        if (isTtsActive) speakText(`${topic.title}. ${topic.description}`);
    }

    function createImageArea() {
        const area = document.createElement('section');
        area.id = 'image-area';
        area.className = 'image-container';
        conceptsArea.parentNode.insertBefore(area, conceptsArea);
        return area;
    }

    function loadQuiz(quiz) {
        quizQuestion.textContent = quiz.question;
        quizQuestion.setAttribute('tabindex', '0');
        quizOptions.innerHTML = '';
        quizFeedback.textContent = '';
        quizFeedback.className = 'feedback';

        // Leer la pregunta automáticamente si el TTS está activo
        if (isTtsActive) speakText("Pregunta: " + quiz.question);

        // Añadir eventos de lectura a la pregunta
        quizQuestion.addEventListener('mouseenter', () => { if (isTtsActive) speakText(quiz.question); });
        quizQuestion.addEventListener('focus', () => { if (isTtsActive) speakText(quiz.question); });

        quiz.options.forEach((option, index) => {
            const btn = document.createElement('button');
            btn.className = 'btn btn-secondary';
            btn.textContent = option;
            btn.setAttribute('aria-label', `Opción ${index + 1}: ${option}`);
            btn.onclick = () => checkAnswer(index, quiz);
            
            // Lectura al pasar cursor o foco
            btn.addEventListener('mouseenter', () => { if (isTtsActive) speakText(`Opción ${index + 1}: ${option}`); });
            btn.addEventListener('focus', () => { if (isTtsActive) speakText(`Opción ${index + 1}: ${option}`); });
            
            quizOptions.appendChild(btn);
        });
    }

    function checkAnswer(selectedIndex, quiz) {
        if (selectedIndex === quiz.answer) {
            quizFeedback.textContent = "✅ " + quiz.feedback;
            quizFeedback.className = 'feedback success';
            addPoints(50);
            if (isTtsActive) speakText("¡Excelente! " + quiz.feedback);
        } else {
            quizFeedback.textContent = "❌ Inténtalo de nuevo. Revisa los conceptos arriba.";
            quizFeedback.className = 'feedback error';
            if (isTtsActive) speakText("Vuelve a intentarlo.");
        }
    }

    function addPoints(amount) {
        points += amount;
        localStorage.setItem('mathPoints', points);
        updateProgress();
    }

    function updateProgress() {
        pointsCounter.textContent = points;
        if (points < 100) levelDisplay.textContent = "Explorador";
        else if (points < 300) levelDisplay.textContent = "Aprendiz Matemático";
        else if (points < 600) levelDisplay.textContent = "Calculador Experto";
        else levelDisplay.textContent = "Maestro de las Matemáticas";
    }

    // --- ACCESIBILIDAD ---

    // Lectura de pantalla (TTS)
    function speakText(text) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'es-ES';
        window.speechSynthesis.speak(utterance);
    }

    startReadingBtn.onclick = () => {
        if (currentTopicIndex === -1) {
            speakText("Por favor selecciona un tema primero.");
        } else {
            const topic = contentData.topics[currentTopicIndex];
            speakText(`${topic.title}. ${topic.description}. Conceptos: ${topic.concepts.join('. ')}`);
        }
    };

    document.getElementById('toggle-tts').onclick = (e) => {
        isTtsActive = !isTtsActive;
        localStorage.setItem('ttsEnabled', isTtsActive);
        updateTtsUI();
        if (isTtsActive) speakText("Lector automático activado.");
    };

    function updateTtsUI() {
        if (!ttsToggleBtn) return;
        ttsToggleBtn.setAttribute('aria-pressed', isTtsActive);
        ttsToggleBtn.textContent = isTtsActive ? "Lector Automático: ON" : "Lector Automático: OFF";
    }

    // Contraste
    document.getElementById('toggle-contrast').onclick = () => {
        document.body.classList.toggle('dark-theme');
        const isDark = document.body.classList.contains('dark-theme');
        localStorage.setItem('mathTheme', isDark ? 'dark' : 'light');
    };

    // Tamaño de fuente
    document.getElementById('increase-font').onclick = () => {
        if (fontSize < 32) {
            fontSize += 2;
            applyFontSize();
        }
    };

    document.getElementById('decrease-font').onclick = () => {
        if (fontSize > 14) {
            fontSize -= 2;
            applyFontSize();
        }
    };

    function applyFontSize() {
        document.documentElement.style.setProperty('--font-size-base', fontSize + 'px');
        localStorage.setItem('mathFontSize', fontSize);
    }

    // Cargar preferencias guardadas
    if (localStorage.getItem('mathTheme') === 'dark') {
        document.body.classList.add('dark-theme');
    }
});