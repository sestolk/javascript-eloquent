var app;

describe("A database", function ()
{
	var db = new Database('Test');

	it("should be created", function ()
	{
		expect(db).toEqual(jasmine.any(Database));
	});
});

describe("Eloquent", function()
{
	app = {db: new Database('Test')};
	var eloquent = new Eloquent();

	it("can be instantiated with the database", function()
	{
		expect(eloquent).toEqual(jasmine.any(Eloquent));
	});
});