-- price_cache is read by its cache_key primary key. fetched_at is inspected
-- only after that single-row lookup, so this extra index never serves a query
-- and only adds write/storage overhead.
drop index if exists price_cache_fetched_at_idx;
