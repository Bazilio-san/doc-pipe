/* eslint-disable no-new-func,no-restricted-syntax */
import * as espree from 'espree';
import * as estraverse from 'estraverse';
import { logger } from '../../services/logger';

const unsafePatterns = [
  /while\s*\(true\)/, // Prohibit infinite loops
];

function validateUserCode (code) {
  for (const pattern of unsafePatterns) {
    if (pattern.test(code)) {
      throw new Error(`Unsafe expression found: ${pattern}`);
    }
  }
}

export const isCodeSafe = (userCode: string): boolean => {
  validateUserCode(userCode);
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
    const ast = espree.parse(userCode, { ecmaVersion: 'latest' });

    let isSafe = true;

    estraverse.traverse(ast, {
      enter (node) {
        if (node.type === 'Identifier' && bannedIdentifiers.includes(node.name)) {
          isSafe = false;
          this.break();
        }

        if (
          node.type === 'NewExpression'
          && node.callee.type === 'Identifier'
          && node.callee.name === 'Function'
        ) {
          isSafe = false;
          this.break();
        }

        if (
          node.type === 'CallExpression'
          && node.callee.type === 'Identifier'
          && node.callee.name === 'eval'
        ) {
          isSafe = false;
          this.break();
        }

        if (
          node.type === 'MemberExpression'
          && node.object.type === 'Identifier'
          && (node.object.name === 'global' || node.object.name === 'process')
        ) {
          isSafe = false;
          this.break();
        }
      },
    });

    return isSafe;
  } catch (err) {
    logger.error(err);
    return false;
  }
};

export const wrapCode = (s: string) => `const fn = async (page, request, resultData) => {\n${s}\n}`;
