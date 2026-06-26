# Product Datasheets

Drop product datasheet PDFs in this folder, then reference them from the matching
product file in `src/content/products/<slug>.md` by uncommenting and setting:

    datasheet: /datasheets/<filename>.pdf

Until a `datasheet:` path is set, the product shows "Datasheet coming soon" and the
link is disabled. Use lowercase, hyphenated filenames matching the product slug
(e.g. `lime.pdf`, `caustic-soda.pdf`).
