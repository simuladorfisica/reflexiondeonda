const questions = [
  {
    question: '¿Cómo se define el fenómeno de la reflexión en las ondas?',
    options: [
      'Es el cambio de medio de propagación que experimenta una onda al chocar con una superficie.',
      'Es el rebote o cambio de sentido que experimenta un pulso u onda cuando alcanza un extremo de su medio.',
      'Es la pérdida total de energía y desaparición de la perturbación al tocar un obstáculo.',
      'Es la división de una onda en múltiples frecuencias al atravesar un orificio.'
    ], correct: 1
  },
  {
    question: '¿Cuál de las siguientes variables afecta la velocidad de propagación de un pulso en una cuerda?',
    options: ['Ancho del pulso', 'Longitud de la cuerda', 'Amplitud del pulso', 'Tensión de la cuerda'], correct: 3
  },
  {
    question: 'Si un rayo de luz incide sobre un espejo plano formando un ángulo de 40° con la normal, ¿cuánto valdrá el ángulo de reflexión?',
    options: ['45°', '20°', '80°', '40°'], correct: 3
  },
  {
    question: '¿Qué magnitud de la velocidad de propagación experimenta un cambio fundamental al reflejarse un pulso en un extremo de una cuerda?',
    options: ['El módulo', 'La dirección', 'El sentido', 'La densidad lineal'], correct: 2
  },
  {
    question: 'En una cuerda tensa, ¿cómo influye un aumento en la tensión (T) sobre la velocidad de propagación del pulso?',
    options: ['Disminuye la velocidad de propagación.', 'Aumenta la velocidad de propagación.', 'La velocidad permanece totalmente constante.', 'Hace que el pulso se refleje invertido.'], correct: 1
  },
  {
    question: 'Si una cuerda de masa 0,100 kg y longitud 2,5 m está sometida a una tensión de 1,44 N, ¿cuál es el valor de su densidad lineal de masa (µ)?',
    options: ['0,04 kg/m', '0,25 kg/m', '0,36 kg/m', '2,50 kg/m'], correct: 0
  },
  {
    question: '¿Qué diferencia principal se observa en la reflexión de un pulso cuando el extremo de la cuerda es libre en comparación con uno fijo?',
    options: ['En el extremo libre el pulso se invierte y en el fijo no.', 'En el extremo libre el pulso no se invierte al reflejarse.', 'En el extremo libre el pulso se detiene por completo.', 'No existe ninguna diferencia en el comportamiento del pulso.'], correct: 1
  },
  {
    question: 'Si un pulso se propaga hacia la derecha en una cuerda y choca contra un soporte rígido fijo, ¿hacia dónde se dirigirá la onda reflejada?',
    options: ['Continuará propagándose hacia la derecha', 'Se propagará hacia la izquierda', 'Se quedará oscilando en el mismo punto fijo', 'Descenderá verticalmente hacia el suelo'], correct: 1
  },
  {
    question: '¿Cuál de las siguientes afirmaciones sobre la reflexión de las ondas es correcta?',
    options: ['La reflexión ocurre únicamente en ondas luminosas.', 'Una onda reflejada siempre cambia su frecuencia.', 'La reflexión ocurre cuando una onda encuentra un obstáculo o límite y retorna al medio de propagación.', 'La reflexión provoca necesariamente la desaparición de la onda incidente.'], correct: 2
  },
  {
    question: '¿Qué es la normal en el fenómeno de reflexión?',
    options: ['Es el rayo de luz que llega a la superficie.', 'Es una línea imaginaria perpendicular a la superficie en el punto donde incide el rayo.', 'Es la trayectoria que sigue el rayo reflejado.', 'Es la superficie donde se produce la reflexión.'], correct: 1
  },
  {
    question: '¿Qué ocurre con el ángulo de reflexión si aumenta el ángulo de incidencia?',
    options: ['Disminuye.', 'Permanece constante.', 'Aumenta en la misma proporción.', 'Se vuelve siempre igual a 90°.'], correct: 2
  },
  {
    question: '¿Cuál es la función principal de una cubeta de ondas?',
    options: ['Medir la temperatura del agua.', 'Observar y estudiar el comportamiento y la propagación de las ondas en el agua.', 'Medir la presión atmosférica.', 'Determinar la densidad de diferentes líquidos.'], correct: 1
  },
  {
    question: '¿Cómo se generan las ondas en una cubeta de ondas?',
    options: ['Mediante una fuente vibratoria que produce perturbaciones en la superficie del agua.', 'Mediante el calentamiento del agua.', 'Mediante la presión ejercida por el aire.', 'Mediante la evaporación del agua.'], correct: 0
  },
  {
    question: '¿Cuál es la función de la luz en una cubeta de ondas?',
    options: ['Generar las ondas en el agua.', 'Permitir visualizar las ondas mediante sus sombras o proyecciones.', 'Modificar la frecuencia de las ondas.', 'Aumentar la velocidad de propagación.'], correct: 1
  }
];

const container = document.getElementById('quiz-container');
const checkButton = document.getElementById('check-quiz');
const resetButton = document.getElementById('reset-quiz');
const result = document.getElementById('quiz-result');
let answers = Array(questions.length).fill(null);
let checked = false;

function renderQuiz() {
  container.innerHTML = '';
  questions.forEach((item, index) => {
    const card = document.createElement('section');
    card.className = 'quiz-question';
    const heading = document.createElement('h2');
    heading.textContent = `${index + 1}. ${item.question}`;
    card.appendChild(heading);
    const options = document.createElement('div');
    options.className = 'answers';
    item.options.forEach((option, optionIndex) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'answer';
      button.textContent = `${String.fromCharCode(65 + optionIndex)}. ${option}`;
      button.setAttribute('aria-pressed', answers[index] === optionIndex ? 'true' : 'false');
      if (answers[index] === optionIndex) button.classList.add('selected');
      if (checked) {
        button.disabled = true;
        if (optionIndex === item.correct) button.classList.add('correct');
        else if (answers[index] === optionIndex) button.classList.add('incorrect');
      }
      button.addEventListener('click', () => {
        if (checked) return;
        answers[index] = optionIndex;
        renderQuiz();
      });
      options.appendChild(button);
    });
    card.appendChild(options);
    if (checked) {
      const feedback = document.createElement('p');
      feedback.className = 'feedback';
      feedback.textContent = answers[index] === item.correct
        ? 'Respuesta correcta.'
        : `Respuesta correcta: ${String.fromCharCode(65 + item.correct)}. ${item.options[item.correct]}`;
      card.appendChild(feedback);
    }
    container.appendChild(card);
  });
}

checkButton.addEventListener('click', () => {
  const unanswered = answers.filter(answer => answer === null).length;
  if (unanswered > 0) {
    result.textContent = `Te faltan ${unanswered} pregunta${unanswered === 1 ? '' : 's'} por responder.`;
    return;
  }
  checked = true;
  const score = answers.reduce((total, answer, index) => total + (answer === questions[index].correct ? 1 : 0), 0);
  result.textContent = `Obtuviste ${score} de ${questions.length} respuestas correctas (${Math.round(score / questions.length * 100)}%).`;
  renderQuiz();
});

resetButton.addEventListener('click', () => {
  answers = Array(questions.length).fill(null);
  checked = false;
  result.textContent = '';
  renderQuiz();
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

renderQuiz();