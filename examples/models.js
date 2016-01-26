/**
 * Market model
 *
 * @returns {MarketModel}
 *
 * @constructor
 */
var MarketModel = function ()
{
	Eloquent.call(this);

	var _this = this;

	// Set the table name
	this.table = 'markets';

	this.createModel = function(callback)
	{
		return _this
			.createColumn('id', 'INTEGER', true, true)
			.createColumn('city_id', 'INTEGER', false)
			.createColumn('title', 'TEXT', true)
			.createTable(callback);
	};

	/**
	 * Market belongsTo one city
	 *
	 * @returns {Eloquent}
	 */
	this.city = function ()
	{
		return _this.belongsTo('CityModel', 'city_id', 'id', arguments);
	};

	return this;
};

/**
 * City model
 *
 * @returns {CityModel}
 *
 * @constructor
 */
var CityModel = function ()
{
	Eloquent.call(this);

	var _this = this;

	// Set the table name
	this.table = 'cities';

	this.createModel = function(callback)
	{
		return _this
			.createColumn('id', 'INTEGER', true, true)
			.createColumn('title', 'TEXT', true)
			.createTable(callback);
	};

	return this;
};