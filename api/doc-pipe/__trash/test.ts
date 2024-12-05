import * as fs from 'fs-extra';
import { isCodeSafe } from '../utils/js-code-validator';
import { logger } from '../../services/logger';

const js4print = (s: string) => `\n\`\`\`javaScript\n${s}\n\`\`\``;

const getSnippet1 = () => fs.readFileSync('D:\\work\\PROJ\\AI\\doc-pipe\\api\\doc-pipe\\snippet1.js', { encoding: 'utf8' });
const codeFragment = getSnippet1();
// Выполняем заданный фрагмент кода JavaScript
if (!isCodeSafe(codeFragment)) {
  // Предупреждение: выполнение произвольного кода может быть небезопасно.
  // Убедитесь, что codeFragment исходит из доверенного источника.
  logger.error(`Пользовательский JS не безопасен:${js4print(codeFragment)}`);
}
