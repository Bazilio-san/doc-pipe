const { VM } = require('vm2');



function executeUserCode(code, params = {}) {
  // Проверка безопасности
  validateUserCode(code);

  // Контекст выполнения
  const vm = new VM({
    timeout: 1000, // Ограничение времени выполнения (1 секунда)
    sandbox: { ...params }, // Передаем параметры в контекст
  });

  // Выполнение кода
  return vm.run(code);
}

// Пример использования
const userCode = `
  const result = x + y;
  return result;
`;

try {
  const params = { x: 10, y: 20 };
  const result = executeUserCode(userCode, params);
  console.log('Результат:', result);
} catch (error) {
  console.error('Ошибка выполнения:', error.message);
}
