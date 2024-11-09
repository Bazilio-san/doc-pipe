export const PG = {
  VALUES_TO_MERGE: 999, // Максимальное количество VALUES в одной инструкции
  DB_ID: {
    CSBOT: 'csbot',
    PERSON: 'person',
  },
};

export const TABLE = {
  DLINK: 'core.dlink',
  V_DLINK: 'core.v_dlink',
};

export const ROOT_PROJECT_DIR = process.cwd();

export const DEFAULT_EMBED_MODEL = {
  model: 'text-embedding-3-large',
  dimensions: 1536,
};
export const SMALL_EMBED_MODEL = {
  model: 'text-embedding-3-small',
  dimensions: 256,
};

export const GEN_FILES_DIR = '_files';
export const FILES_DIR_FORMAT = 'yyMMdd';
