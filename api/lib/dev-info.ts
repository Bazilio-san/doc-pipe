import * as cp from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import getBranchName from 'current-git-branch';
import os from 'os';
import { config } from '../bootstrap/init-config';
import { PG, ROOT_PROJECT_DIR } from '../constants';

const branchName = getBranchName();

const packageJsonPath = path.resolve(path.join(ROOT_PROJECT_DIR, 'package.json'));

// eslint-disable-next-line import/no-dynamic-require
const packageJson = require(packageJsonPath);

const nodeModulesDir = path.resolve(path.join(ROOT_PROJECT_DIR, 'node_modules'));

const getModuleVersion = (moduleName: string): string | undefined => {
  const pjPath = path.resolve(path.join(nodeModulesDir, moduleName, 'package.json'));
  if (fs.existsSync(pjPath)) {
    // eslint-disable-next-line import/no-dynamic-require
    const pj = require(pjPath);
    return pj.version;
  }
};

const af = [
  'af-ad-ts',
  'af-initials-avatar',
  'af-color',
  'af-consul',
  'af-crypto',
  'af-db',
  'af-db-ts',
  'af-echo',
  'af-echo-ts',
  'af-estimate',
  'af-fns',
  'af-lib',
  'af-logger',
  'af-logger-ts',
  'af-streams',
  'af-tools-ts',
  'config-service',
].reduce((accum, moduleName) => {
  const v = getModuleVersion(moduleName);
  if (v) {
    accum[moduleName] = v;
  }
  return accum;
}, {});

const databases = {
  postgres: Object.entries(config.db.postgres?.dbs || {})
    .filter(([id]) => Object.values(PG.DB_ID).includes(id))
    .reduce((accum, [id, dbConfig]) => {
      const { host, port, database, user, label } = dbConfig;
      accum[id] = `${label ? `${label}\t` : ''}${user}@[${host}:${port}].[${database}]`;
      return accum;
    }, {}),
};

const getDevInfo = () => {
  const HEAD: any = {};
  const Repo: any = {};
  let nodeVersion = '';
  try {
    Repo.hash = cp.execSync(`git rev-parse --short ${branchName}@{upstream}`).toString().trim();
    try {
      Repo.message = cp.execSync(`git log -n 1 --pretty=format:%s ${Repo.hash}`).toString().trim();
    } catch (e) {
      //
    }
    try {
      Repo.date = cp.execSync(`git show -s --format=%ci ${Repo.hash}`).toString().trim();
    } catch (e) {
      //
    }
  } catch (e: Error | any) {
    if (/no upstream configured for branch/.test(e.stack)) {
      Repo.hash = `no upstream configured for branch '${branchName}'`;
    }
  }
  try {
    nodeVersion = cp.execSync(`node -v`).toString().trim().replace(/^v/, '');
  } catch (e) {
    //
  }
  try {
    HEAD.hash = cp.execSync('git rev-parse --short HEAD').toString().trim();
  } catch (e) {
    //
  }
  try {
    HEAD.message = cp.execSync(`git log -n 1 --pretty=format:%s ${HEAD.hash}`).toString().trim();
  } catch (e) {
    //
  }
  try {
    HEAD.date = cp.execSync(`git show -s --format=%ci ${HEAD.hash}`).toString().trim();
  } catch (e) {
    //
  }
  const result: any = {
    name: packageJson.name,
    version: packageJson.version,
    branchName,
    HEAD,
    Repo,
    Host: os.hostname(),
    mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
    databases,
    versions: {
      node: nodeVersion,
      af,
    },
  };
  if (config.webServer) {
    const { port, host } = config.webServer;
    result.listen = `http://${host}:${port}`;
  }
  return result;
};

export const devInfo = getDevInfo();
