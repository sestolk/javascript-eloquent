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

	it("can create the table", function (done)
	{
		market.createModel(done);
	});
});

describe("Queries", function ()
{
	var db, market, insertedId;

	beforeEach(function ()
	{
		db = new Database('Test');
		app = {db: db.getDatabase()};
		market = new MarketModel();
	});

	it("remove and (re)-create the table", function (done)
	{
		market.drop(function ()
		{
			market.createModel(done);
		});
	});

	it("insert one record", function (done)
	{
		market.column('title', 'Test market 1').add(function (insertId)
		{
			insertedId = insertId;

			expect(insertId).toBe(1);

			done();
		});
	});

	it("retrieve one record", function (done)
	{
		market.id(insertedId).first(null, function (result)
		{
			expect(result).toEqual({id: 1, title: 'Test market 1'});

			done();
		});
	});

	it("insert more records", function (done)
	{
		var iterator = new EloquentIterator();

		iterator.addIteration(function(next)
		{
			new MarketModel()
				.column('title', 'Test market 2')
				.add(function (insertId)
			{
				expect(insertId).toBe(2);

				next();
			});
		});

		iterator.addIteration(function(next)
		{
			new MarketModel()
				.column('title', 'Test market 3')
				.add(function (insertId)
				{
					expect(insertId).toBe(3);

					next();
				});
		});

		iterator.addIteration(function(next)
		{
			new MarketModel()
				.column('title', 'Test market 4')
				.add(function (insertId)
				{
					expect(insertId).toBe(4);

					next();
				});
		});

		iterator.run(done);
	});

	it("retrieve multiple records", function(done)
	{
		market.get(null, function (result)
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

	/*
	TODO: Things to test
	- updates
	- where, orWhere, whereIn, whereNested
	- join
	- delete
	- relations
	- limit
	- order by

	 */
});