var cb = function () {};

/**
 * Create the market table
 */
new MarketModel()
	// Define column NOT NULL and to be autoincrementing (also makes this the primary key)
	.createColumn('id', 'INTEGER', false, true)
	.createColumn('city_id', 'INTEGER', false)
	// Define column NOT NULL
	.createColumn('title', 'TEXT', false)
	.createTable(cb);

/* Another example (NO autoincrement) */
new MarketModel()
	// Define column NOT NULL
	.createColumn('id', 'INTEGER', false)
	.createColumn('city_id', 'INTEGER', false)
	// Define column to allow NULL
	.createColumn('title', 'TEXT', true)
	// Define one or more columns to be the primary key
	.primaryKey(['id', 'city_id'])
	.createTable(cb);

/**
 * Get all items
 */
new MarketModel().all(null, cb);

/**
 * Get the first item
 */
new MarketModel().first(null, cb);

/**
 * Join another table
 */
new MarketModel().join('cities', 'cities.id', '=', 'markets.city_id').first(null, cb);

/**
 * Add some relations
 * The relation must be defined in the model
 */
new MarketModel().relations('city').first(['id', 'city_id', 'title'], cb);

/**
 * Get all items with several statements
 */
new MarketModel().where('city_id', '=', 2).orWhere('city_id', '=', 4).get(null, cb);

/* Another example using a WHERE IN statement */
new MarketModel().where('city_id', 'IN', [2, 4]).get(null, cb);

/* Another example with a nested WHERE () */
new MarketModel().whereNested(function ( q )
{
	return q.where('city_id', 'IN', [2, 4]);
}).get(null, cb);

/* Another example with an ORDER BY statement */
new MarketModel().where('city_id', 'IN', [2, 4]).orderBy('title').get(null, cb);