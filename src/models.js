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

	// Set the table name
	this.table = 'cities';

	return this;
};