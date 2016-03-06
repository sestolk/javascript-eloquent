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
	var db, market, city;

	beforeAll(function ()
	{
		db = new Database('Test');
		app = {db: db.getDatabase()};
		market = new Market();
	});

	it("can be properly instantiated", function ()
	{
		expect(market).toEqual(jasmine.any(Market));
	});

	it("use the table that has been defined in their models", function ()
	{
		expect(market.table).toEqual('markets');
	});

	it("can create the table", function (done)
	{
		market.createModel(done);
	});

	// Drop and create
	it("drop and (re)-create the table", function (done)
	{
		new Market().drop(function ()
		{
			new Market().createModel(done);
		});
	});

	// Drop and create multiple tables
	it("drop and (re)-create multiple tables", function (done)
	{
		var iterator = new QueryIterator();

		iterator.add(function (next)
		{
			new Market().drop(function ()
			{
				new Market().createModel(next);
			});
		});

		iterator.add(function (next)
		{
			new City().drop(function ()
			{
				new City().createModel(next);
			});
		});

		iterator.run(done);
	});
});

describe("Queries", function ()
{
	var db, insertedId;

	beforeEach(function ()
	{
		db = new Database('Test');
		app = {db: db.getDatabase()};
	});

	// Insert one
	it("insert one record", function (done)
	{
		new Market()
			.insert({
				city_id: 1,
				title: 'Test market 1'
			}, function (insertId)
			{
				insertedId = insertId;

				expect(insertId).toBe(1);

				done();
			});
	});

	// First
	it("retrieve one record", function (done)
	{
		new Market()
			.id(insertedId)
			.first(null, function (result)
			{
				expect(result).toEqual({id: 1, city_id: 1, title: 'Test market 1'});

				done();
			});
	});

	// Insert multiple
	it("insert more records", function (done)
	{
		var iterator = new QueryIterator();

		iterator.add(function (next)
		{
			new Market()
				.insert({
					city_id: 1,
					title: 'Test market 2'
				}, function (insertId)
				{
					expect(insertId).toBe(2);

					next();
				});
		});

		iterator.add(function (next)
		{
			new Market()
				.insert({
					city_id: 2,
					title: 'Test market 3'
				}, function (insertId)
				{
					expect(insertId).toBe(3);

					next();
				});
		});

		iterator.add(function (next)
		{
			new Market()
				.insert({
					city_id: 1,
					title: 'Test market 4'
				}, function (insertId)
				{
					expect(insertId).toBe(4);

					next();
				});
		});

		iterator.add(function (next)
		{
			new City()
				.insert({
					title: 'Rotterdam'
				}, function (insertId)
				{
					expect(insertId).toBe(1);

					next();
				});
		});

		iterator.run(done);
	});

	// Get
	it("retrieve multiple records", function (done)
	{
		new Market().get(['id', 'title'], function (result)
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
	it("orders records by title", function (done)
	{
		new Market()
			.orderBy('title', 'desc')
			.get(['id', 'title'], function (result)
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
	it("orders 2 records by title", function (done)
	{
		new Market()
			.orderBy('title', 'desc')
			.limit(2)
			.get(['id', 'title'], function (result)
			{
				expect(result).toEqual(
					[
						{id: 4, title: 'Test market 4'},
						{id: 3, title: 'Test market 3'}
					]);

				done();
			});
	});

	// order by
	it("orders records by title and city_id", function (done)
	{
		new Market()
			.orderBy('title', 'desc')
			.orderBy('city_id', 'asc')
			.get(function (result)
			{
				expect(result).toEqual(
					[
						{id: 4, city_id: 1, title: 'Test market 4'},
						{id: 3, city_id: 2, title: 'Test market 3'},
						{id: 2, city_id: 1, title: 'Test market 2'},
						{id: 1, city_id: 1, title: 'Test market 1'}
					]);

				done();
			});
	});

	// where
	it("where id equals", function (done)
	{
		new Market()
			.where('id', '=', 3)
			.first(['id', 'title'], function (result)
			{
				expect(result).toEqual({id: 3, title: 'Test market 3'});

				done();
			});
	});

	// orWhere
	it("where id equals or equals", function (done)
	{
		new Market()
			.where('id', '=', 3)
			.orWhere('id', '=', 2)
			.orderBy('title', 'asc')
			.get(['id', 'title'], function (result)
			{
				expect(result).toEqual([{id: 2, title: 'Test market 2'}, {id: 3, title: 'Test market 3'}]);

				done();
			});
	});

	// Where In
	it("where id in equals", function (done)
	{
		new Market()
			.whereIn('id', [2, 3])
			.orderBy('title', 'asc')
			.get(['id', 'title'], function (result)
			{
				expect(result).toEqual([{id: 2, title: 'Test market 2'}, {id: 3, title: 'Test market 3'}]);

				done();
			});
	});

	it("where nested wheres", function (done)
	{
		new Market()
			.whereNested(function (q)
			{
				return q.where('id', '=', 2).orWhere('id', '=', 3);
			})
			.orderBy('title', 'asc')
			.get(['id', 'title'], function (result)
			{
				expect(result).toEqual([{id: 2, title: 'Test market 2'}, {id: 3, title: 'Test market 3'}]);

				done();
			});
	});

	it("nested wheres combined with where", function (done)
	{
		new Market()
			.where('city_id', 1)
			.whereNested(function (q)
			{
				return q.where('id', '=', 2).orWhere('id', '=', 3);
			})
			.orderBy('title', 'asc')
			.get(['id', 'title'], function (result)
			{
				expect(result).toEqual([{id: 2, title: 'Test market 2'}]);

				done();
			});
	});

	it("joins with a table", function (done)
	{
		new Market()
			.alias('m')
			.join('cities AS c', 'c.id', '=', 'm.city_id')
			.orderBy('m.title', 'asc')
			.get(['m.*'], function (result)
			{
				expect(result).toEqual([
					{id: 1, city_id: 1, title: 'Test market 1'},
					{id: 2, city_id: 1, title: 'Test market 2'},
					{id: 4, city_id: 1, title: 'Test market 4'}
				]);

				done();
			});
	});

	it("updates a record", function (done)
	{
		new Market()
			.where('id', 3)
			.update({
				title: 'Test market 3 (updated)'
			}, function (result)
			{
				expect(result).toEqual(true);

				done();
			});
	});

	it("updates non-existing record", function (done)
	{
		new Market()
			.where('id', 6)
			.update({
				title: 'Does not exist'
			}, function (result)
			{
				expect(result).toEqual(false);

				done();
			});
	});

	/*it("delete from a table", function (done)
	{
		new Market()
			.where('id', 3)
			.remove(function (result)
			{
				expect(result).toEqual([]);

				new Market().all(function (result)
				{
					expect(result).toEqual([
						{id: 1, city_id: 1, title: 'Test market 1'},
						{id: 2, city_id: 1, title: 'Test market 2'},
						{id: 4, city_id: 1, title: 'Test market 4'}
					]);

					done();
				});
			});
	});

	it("empty a table", function (done)
	{
		new Market()
			.empty(function (result)
			{
				expect(result).toEqual([]);

				new Market().all(function (result)
				{
					expect(result).toEqual([]);

					done();
				});
			});
	});*/

	/*
	 TODO: Things to test
	 - updates
	 - relations
	 */
});