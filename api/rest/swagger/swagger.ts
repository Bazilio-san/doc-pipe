import path from 'path';
import fs from 'fs';
import swaggerUi from 'swagger-ui-express';
import express from 'express';
import YAML from 'yaml';
import { ROOT_PROJECT_DIR } from '../../constants';
import { config } from '../../bootstrap/init-config';
import { toSrcPath } from '../../lib/utils';

const file = fs.readFileSync(path.join(toSrcPath(__dirname), 'swagger.yaml'), 'utf8');
const swaggerDocument = YAML.parse(file);
swaggerDocument.info.version = config.version;
swaggerDocument.servers.forEach((server: any) => {
  if (server.url.includes('localhost:8866')) {
    server.url = server.url.replace(':8866', `:${config.webServer.port}`);
  }
});

fs.writeFile(
  path.join(ROOT_PROJECT_DIR, 'api/doc-pipe-api/swagger/swagger-auto-generated.json'),
  JSON.stringify(swaggerDocument, undefined, 2),
  { encoding: 'utf8' },
  () => 0,
);

export const swaggerDocs = (app: express.Express) => {
  // Swagger Page
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
  // Documentation in JSON format
  app.get('/docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerDocument);
  });
};
