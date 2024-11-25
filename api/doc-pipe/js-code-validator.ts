/* eslint-disable no-new-func,no-restricted-syntax */
import * as esprima from 'esprima';
// Для обхода AST используем estraverse
import * as estraverse from 'estraverse';
import { logger } from '../services/logger';

const unsafePatterns = [
  /while\s*\(true\)/, // Запретить бесконечные циклы
];

function validateUserCode (code) {
  for (const pattern of unsafePatterns) {
    if (pattern.test(code)) {
      throw new Error(`Найдено небезопасное выражение: ${pattern}`);
    }
  }
}

export const isCodeSafe = (userCode: string): boolean => {
  validateUserCode(userCode);
  // Список запрещенных идентификаторов
  const bannedIdentifiers: string[] = [
    'process',
    'require',
    'fs',
    'child_process',
    'eval',
    'Function',
    'global',
    'setImmediate',
    'setInterval',
    'setTimeout',
    'Reflect',
    'Proxy',
    'WebAssembly',
  ];

  try {
    const ast = esprima.parseScript(userCode);

    let isSafe = true;

    estraverse.traverse(ast, {
      enter (node) {
        if (node.type === 'Identifier' && bannedIdentifiers.includes(node.name)) {
          isSafe = false;
          this.break(); // Останавливаем обход при нахождении запрещенного идентификатора
        }

        // Проверка использования нового конструктора Function
        if (
          node.type === 'NewExpression'
          && node.callee.type === 'Identifier'
          && node.callee.name === 'Function'
        ) {
          isSafe = false;
          this.break();
        }

        // Проверка вызова eval
        if (
          node.type === 'CallExpression'
          && node.callee.type === 'Identifier'
          && node.callee.name === 'eval'
        ) {
          isSafe = false;
          this.break();
        }

        // Проверка доступа к свойствам global или process
        if (
          node.type === 'MemberExpression'
          && node.object.type === 'Identifier'
          && (node.object.name === 'global' || node.object.name === 'process')
        ) {
          isSafe = false;
          this.break();
        }

        // Дополнительные проверки можно добавить здесь
      },
    });

    return isSafe;
  } catch (err) {
    logger.error(err);
    // Если произошла ошибка при парсинге, считаем код небезопасным
    return false;
  }
};
