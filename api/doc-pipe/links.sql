WITH
  --
  extracted_links AS (
    --
    SELECT
         --
      id
         , regexp_replace(
        unnest(regexp_matches(ent, 'https?://[^\s]+', 'g')),
        '[\]),.\\/]+$', '', 'g'
           ) AS link
    FROM txt.dataset
    WHERE ent ~ 'https?://'
      AND "blockId" = 1
      AND deleted != true
    --
  ),
  final AS (
    --
    SELECT
         --
      link
         , array_agg(DISTINCT id) AS ids
         , count(DISTINCT id)     AS id_count
    FROM extracted_links
    GROUP BY link
    --
  )
-- @formatter:off
-- SELECT  * FROM final;

INSERT INTO core.dlink ("createdAt", "createdBy", "updatedAt", "updatedBy", "blockId", "url", skip, use)
SELECT CURRENT_TIMESTAMP, 'sys',
       CURRENT_TIMESTAMP, 'sys',
       1, link, true, false FROM final
ON CONFLICT (url)
  DO NOTHING;
;


