var app;

describe("A database", function ()
{
	var db = new Database('Test');

	it("should be created", function ()
	{
		expect(db).toEqual(jasmine.any(Database));
	});
});

describe("Eloquent", function ()
{
	var db, eloquent;

	beforeAll(function ()
	{
		db = new Database('Test');
		app = {db: db.getDatabase()};
		eloquent = new Eloquent();
	});

	it("can be instantiated with the database", function ()
	{
		expect(eloquent).toEqual(jasmine.any(Eloquent));
	});
});

describe("Models", function ()
{
	var db, market;

	beforeAll(function ()
	{
		db = new Database('Test');
		app = {db: db.getDatabase()};
		market = new MarketModel();
	});

	it("can be properly instantiated", function ()
	{
		expect(market).toEqual(jasmine.any(MarketModel));
	});

	it("use the table that has been defined in their models", function ()
	{
		expect(market.table).toEqual('markets');
	});

	it("can create the table", function ( done )
	{
		market.createModel(done);
	});
});

describe("Queries", function ()
{
	var db, market, city, insertedId;

	beforeEach(function ()
	{
		db = new Database('Test');
		app = {db: db.getDatabase()};
		market = new MarketModel();
		city = new CityModel();
	});

	// Drop and create
	it("remove and (re)-create the table", function ( done )
	{
		market.drop(function ()
		{
			market.createModel(done);
		});
	});

	// Drop and create multiple tables
	it("remove and (re)-create the table", function ( done )
	{
		var iterator = new EloquentIterator();

		iterator.addIteration(function ( next )
		{
			market.drop(function ()
			{
				market.createModel(next);
			});
		});

		iterator.addIteration(function ( next )
		{
			city.drop(function ()
			{
				city.createModel(next);
			});
		});

		iterator.run(done);
	});

	// Insert one
	it("insert one record", function ( done )
	{
		market
			.column('city_id', 1)
			.column('title', 'Test market 1')
			.add(function ( insertId )
		{
			insertedId = insertId;

			expect(insertId).toBe(1);

			done();
		});
	});

	// First
	it("retrieve one record", function ( done )
	{
		market.id(insertedId).first(null, function ( result )
		{
			expect(result).toEqual({id: 1, city_id: 1, title: 'Test market 1'});

			done();
		});
	});

	// Insert multiple
	it("insert more records", function ( done )
	{
		var iterator = new EloquentIterator();

		iterator.addIteration(function ( next )
		{
			new MarketModel()
				.column('city_id', 1)
				.column('title', 'Test market 2')
				.add(function ( insertId )
				{
					expect(insertId).toBe(2);

					next();
				});
		});

		iterator.addIteration(function ( next )
		{
			new MarketModel()
				.column('city_id', 2)
				.column('title', 'Test market 3')
				.add(function ( insertId )
				{
					expect(insertId).toBe(3);

					next();
				});
		});

		iterator.addIteration(function ( next )
		{
			new MarketModel()
				.column('city_id', 1)
				.column('title', 'Test market 4')
				.add(function ( insertId )
				{
					expect(insertId).toBe(4);

					next();
				});
		});

		iterator.run(done);
	});

	// Get
	it("retrieve multiple records", function ( done )
	{
		market.get(['id', 'title'], function ( result )
		{
			expect(result).toEqual(
				[
					{id: 1, title: 'Test market 1'},
					{id: 2, title: 'Test market 2'},
					{id: 3, title: 'Test market 3'},
					{id: 4, title: 'Test market 4'}
				]);

			done();
		});
	});

	// order by
	it("orders records by title", function ( done )
	{
		market.orderBy('title', 'desc').get(['id', 'title'], function ( result )
		{
			expect(result).toEqual(
				[
					{id: 4, title: 'Test market 4'},
					{id: 3, title: 'Test market 3'},
					{id: 2, title: 'Test market 2'},
					{id: 1, title: 'Test market 1'}
				]);

			done();
		});
	});

	// order by and limit
	it("orders 2 records by title", function ( done )
	{
		market.orderBy('title', 'desc').limit(2).get(['id', 'title'], function ( result )
		{
			expect(result).toEqual(
				[
					{id: 4, title: 'Test market 4'},
					{id: 3, title: 'Test market 3'}
				]);

			done();
		});
	});

	// where
	it("where id equals", function ( done )
	{
		market.where('id', '=', 3).first(['id', 'title'], function ( result )
		{
			expect(result).toEqual({id: 3, title: 'Test market 3'});

			done();
		});
	});

	// orWhere
	it("where id equals or equals", function ( done )
	{
		market
			.where('id', '=', 3)
			.orWhere('id', '=', 2)
			.orderBy('title', 'asc')
			.get(['id', 'title'], function ( result )
			{
				expect(result).toEqual([{id: 2, title: 'Test market 2'}, {id: 3, title: 'Test market 3'}]);

				done();
			});
	});

	// Where In
	it("where id in equals", function ( done )
	{
		market
			.whereIn('id', [2, 3])
			.orderBy('title', 'asc')
			.get(['id', 'title'], function ( result )
			{
				expect(result).toEqual([{id: 2, title: 'Test market 2'}, {id: 3, title: 'Test market 3'}]);

				done();
			});
	});

	it("where nested wheres", function ( done )
	{
		market
			.whereNested(function(q)
			{
				return q.where('id', '=', 2).orWhere('id', '=', 3);
			})
			.orderBy('title', 'asc')
			.get(['id', 'title'], function ( result )
			{
				expect(result).toEqual([{id: 2, title: 'Test market 2'}, {id: 3, title: 'Test market 3'}]);

				done();
			});
	});

	/*
	 TODO: Things to test
	 - updates
	 - join
	 - delete
	 - relations
	 */
});