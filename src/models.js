/**
 * Markets Model
 *
 * @constructor
 */
function Markets()
{
	// Extend the Eloquent class
	Eloquent.call(this);

	// Set the table name for this table
	this.table = 'markets';

	// For more options check the Eloquent constructor
}

// Add all methods of Eloquent to this Class
// That is how extending works in Javascript
Markets.prototype = Object.create(Eloquent.prototype);