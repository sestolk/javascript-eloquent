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

	// Set the table name
	this.table = 'markets';

	return this;
};