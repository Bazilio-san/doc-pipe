import * as fsPath from 'path';
import * as fs from 'fs';

export const normalizePath = (path: string) => fsPath.normalize(fsPath.resolve(path.replace(/[/\\]+/g, '/'))).replace(/\\/g, '/');

export const getPackageJson = (relPathToProjRoot: string = '') => {
  try {
    const rootDir = process.cwd();
    const packageJson = normalizePath(`${rootDir}/${relPathToProjRoot}/package.json`);
    if (fs.existsSync(packageJson)) {
      return JSON.parse(fs.readFileSync(packageJson, { encoding: 'utf8' }));
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.log(err);
  }
};

export interface TisHttpAvailableOptions {
  host: string,
  port: string,
  user?: string,
  pass?: string,
  protocol?: string,
  path?: string
}

export const sortByProps = (arr: any[], propName: string, desc = false) => {
  arr.sort((a, b) => {
    if (a[propName] === b[propName]) {
      return 0;
    }
    return (desc ? -1 : 1) * (a[propName] > b[propName] ? 1 : -1);
  });
  return arr;
};
