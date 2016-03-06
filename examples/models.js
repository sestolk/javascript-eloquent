"use strict";

class Base extends Eloquent {
	constructor()
	{
		super();

		this.setDatabase();
	}
}

/**
 * Market model
 *
 * @returns {Market}
 *
 * @constructor
 */
class Market extends Base {
	constructor()
	{
		super();

		this.table = 'markets';
	}

	createModel(cb)
	{
		this.column(new QueryColumn().integer('id').autoincrement());
		this.column(new QueryColumn().integer('city_id'));
		this.column(new QueryColumn().text('title').nullable());

		this.create(cb);
	}

	/**
	 * Market belongsTo one city
	 *
	 * @returns {Eloquent}
	 */
	city()
	{
		return this.belongsTo('CityModel', 'city_id', 'id', arguments);
	}
}

/**
 * City model
 *
 * @returns {City}
 *
 * @constructor
 */
class City extends Base {
	constructor()
	{
		super();

		this.table = 'cities';
	}

	createModel(cb)
	{
		this.column(new QueryColumn().integer('id').autoincrement());
		this.column(new QueryColumn().text('title').nullable());

		this.create(cb);
	}
}