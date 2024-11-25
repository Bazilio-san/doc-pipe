
INSERT INTO ${TABLE_NAME} ("configName", "configValue")
VALUES ('${configName}', %1);

INSERT INTO core.settings ("configName", "configValue")
VALUES ('ddddddd', 123)
ON CONFLICT
UPDATE  "configValue" = %1
INSERT INTO core.settings ("configName", "configValue")
VALUES ('ddddddd', %1)
ON CONFLICT ("configName")
  DO UPDATE SET "configValue" = EXCLUDED."configValue";
