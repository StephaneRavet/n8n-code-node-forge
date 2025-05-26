/*
  This script will be used in a Code node within an n8n workflow.
  The workflow objective is to: retrieve a sales order from an email attachment and inject it into the Odoo ERP.
*/

const data = $input.first().json.message.content;

function escapeForPG(str) {
  return str.replace(/'/g, "''");
}

const jsonUoms = escapeForPG(JSON.stringify(data.uom_uom));

const plpgsqlQuery = `
DO $$
DECLARE
  uom_rec RECORD;
  uoms_json jsonb := '${jsonUoms}'::jsonb;
BEGIN
  -- 1) Unit of Measure: insert if not exists
  FOR uom_rec IN
    SELECT * FROM jsonb_to_recordset(uoms_json) AS(name text)
  LOOP
    IF NOT EXISTS (SELECT 1 FROM uom_uom WHERE name = uom_rec.name) THEN
      INSERT INTO uom_uom(name) VALUES (uom_rec.name);
    END IF;
  END LOOP;
END
$$;
`;

return [{ json: { query: plpgsqlQuery } }];
