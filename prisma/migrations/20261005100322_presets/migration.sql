-- CreateTable
CREATE TABLE "Preset" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "values" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Preset_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Preset_templateId_idx" ON "Preset"("templateId");

-- AddForeignKey
ALTER TABLE "Preset" ADD CONSTRAINT "Preset_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "Template"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Rename `defaultValue` to `example` on template variables and table columns.
UPDATE "Template" t
SET "variables" = COALESCE((
  SELECT jsonb_agg(
    (CASE
      WHEN v ? 'defaultValue' THEN (v - 'defaultValue') || jsonb_build_object('example', v->'defaultValue')
      ELSE v
    END)
    || (CASE
      WHEN jsonb_typeof(v->'columns') = 'array' THEN jsonb_build_object('columns', (
        SELECT COALESCE(jsonb_agg(
          CASE
            WHEN c ? 'defaultValue' THEN (c - 'defaultValue') || jsonb_build_object('example', c->'defaultValue')
            ELSE c
          END
          ORDER BY c_ord
        ), '[]'::jsonb)
        FROM jsonb_array_elements(v->'columns') WITH ORDINALITY AS cols(c, c_ord)
      ))
      ELSE '{}'::jsonb
    END)
    ORDER BY v_ord
  )
  FROM jsonb_array_elements(t."variables") WITH ORDINALITY AS vars(v, v_ord)
), '[]'::jsonb)
WHERE jsonb_typeof(t."variables") = 'array'
  AND t."variables"::text LIKE '%defaultValue%';
