// Crea alumnos de ejemplo con resultados variados usando la misma API que Unity (POST /unity/...).
// Requiere el backend en marcha y UNITY_INGEST_KEY (de .env). Uso: npm run seed:demo
require('dotenv/config');

const baseUrl = process.env.TEST_API_BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
const apiKey = process.env.UNITY_INGEST_KEY;
if (!apiKey) { console.error('Falta UNITY_INGEST_KEY en .env'); process.exit(1); }

const Q = {
  capitulo_1: {
    literal: { texto: '¿Qué representaba realmente el dibujo número 1 del narrador?', opciones: ['Un sombrero', 'Una boa digiriendo un elefante', 'Una montaña'], correcta: 1 },
    inferencial: { texto: '¿Cómo se sintió el narrador cuando nadie entendió su dibujo?', opciones: ['Feliz y orgulloso', 'Indiferente', 'Desanimado e incomprendido'], correcta: 2 },
  },
  capitulo_2: {
    literal: { texto: '¿Dónde se averió el avión del narrador?', opciones: ['En la selva virgen', 'En medio del océano', 'En el desierto del Sahara'], correcta: 2 },
    inferencial: { texto: '¿Por qué al principito le gustó el dibujo de la caja?', opciones: ['Porque era el dibujo más bonito', 'Porque podía imaginar al cordero dentro', 'Porque quería guardar sus cosas'], correcta: 1 },
  },
};
// Resultado por pregunta: 1 = acierta al 1.er intento, 2 = al 2.º, 0 = falla los 2, null = sin responder
// Orden: cap. 1 literal, cap. 1 inferencial, cap. 2 literal, cap. 2 inferencial
const ALUMNOS = [
  ['Mateo', [1, 1, 1, 1]],
  ['Valentina', [1, 2, 1, 2]],
  ['Sofía', [2, 0, 1, 1]],
  ['Diego', [0, 2, 2, 0]],
  ['Lucía', [1, 1, null, null]],
];

async function post(path, body) {
  const response = await fetch(`${baseUrl}${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey }, body: JSON.stringify(body) });
  const data = await response.json();
  if (!response.ok) throw new Error(`${path}: ${response.status} ${JSON.stringify(data)}`);
  return data;
}

(async () => {
  for (const [name, results] of ALUMNOS) {
    const session = await post('/unity/sessions', { name, bookRefId: 'el-principito' });
    let i = 0;
    for (const chapter of ['capitulo_1', 'capitulo_2']) {
      for (const [n, type] of [[1, 'literal'], [2, 'inferencial']]) {
        const outcome = results[i++];
        if (outcome === null) continue;
        const q = Q[chapter][type];
        const letters = ['A', 'B', 'C'];
        const correct = letters[q.correcta];
        const wrong = letters.filter((l) => l !== correct);
        const attempts = { 1: [correct], 2: [wrong[0], correct], 0: [wrong[0], wrong[1]] }[outcome];
        await post(`/unity/sessions/${session.sessionId}/responses`, {
          chapterRefId: chapter, questionNumber: n, questionType: type, questionText: q.texto, options: q.opciones,
          correctLetter: correct, attempts: attempts.map((letter) => ({ letter })),
        });
      }
    }
    await post(`/unity/sessions/${session.sessionId}/complete`, {});
    console.log(`Creado ${name} (${session.studentCode})`);
  }
})().catch((error) => { console.error(error.message); process.exit(1); });
