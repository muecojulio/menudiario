create table if not exists price_cache (
  cache_key text primary key,
  payload text not null,
  fetched_at timestamptz not null default now()
);

create index if not exists price_cache_fetched_at_idx on price_cache (fetched_at desc);
