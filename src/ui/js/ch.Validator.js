/**
* Validator is an engine for HTML forms elements.
* @name Validator
* @class Validator
* @augments ch.Object
* @requires ch.Condition
* @memberOf ch
* @param {Object} conf Object with configuration properties.
* @param {Object} conf.conditions Object with conditions.
* @returns itself
* @factorized
* @see ch.Object
* @see ch.Condition
*/
(function (window, $, ch) {
	'use strict';

	if (window.ch === undefined) {
		throw new window.Error('Expected ch namespace defined.');
	}

	var setTimeout = window.setTimeout;

	function Validator($el, conf) {
		/**
		* Reference to a internal component instance, saves all the information and configuration properties.
		* @protected
		* @name ch.Validator#that
		* @type Object
		*/
		var that = this;

		that.$element = $el;
		that.element = $el[0];
		that.type = 'validator';
		conf = conf || {};

		conf = ch.util.clone(conf);
		that.conf = conf;

	/**
	* Inheritance
	*/

		that = ch._Object.call(that);
		that.parent = ch.util.clone(that);

	/**
	* Private Members
	*/
		var conditions = (function(){
			var c = {}; // temp collection
			var condition = ch.Condition.call(that["public"], conf.condition);

			c[condition.name] = condition;

			// return all the configured conditions
			return c;
		})(); // Love this ;)

		/**
		* Search for instances of Validators with the same trigger, and then merge it's properties with it.
		* @private
		* @name ch.Validator#checkInstance
		* @function
		* @returns Object
		*/
		var checkInstance;
		if (checkInstance = function() {

			var instance, instances = ch.instances.validator;
			if ( instances && instances.length > 0 ) {
				for (var i = 0, j = instances.length; i < j; i+=1) {
					instance = instances[i];

					if (instance.element !== that.element) {

						continue;
					}

					// Extend instance's conditions
					instance.extend(conditions);

					// To let know the ch.Factory that already exists,
					// this way we avoid to have duplicated references.
					return {
						exists: true,
						object: instance
					}
				}
			}
		}()){
			return checkInstance;
		};

		var validate = function(value) {

			if (!that.enabled) { return true; }

			var condition, tested, empty, val, message, required = conditions["required"];

			// Avoid fields that aren't required when they are empty or de-activated
			if (!required && value === "" && that.active === false) { return {"status": true}; }

			if (that.enabled && (!that.active || value !== "" || required)) {
				/**
				* Triggers before start validation process.
				* @name ch.Validator#beforeValidate
				* @event
				* @public
				* @exampleDescription
				* @example
				* widget.on("beforeValidate",function(){
				*	submitButton.disable();
				* });
				*/
				// old callback system
				that.callbacks('beforeValidate');
				// new callback
				that.trigger("beforeValidate");

				// for each condition
				for (condition in conditions){

					val = ((condition === "required") ? that.element : value.toLowerCase());
					// this is the validation
					tested = test.call(this, condition, val);

					// return false if any test fails,
					if (!tested) {

						/**
						* Triggers when an error occurs on the validation process.
						* @name ch.Validator#error
						* @event
						* @public
						* @exampleDescription
						* @example
						* widget.on("error",function(event, condition){
						*	errorModal.show();
						* });
						*/
						// old callback system
						that.callbacks('onError', condition);
						// new callback
						that.trigger("error", condition);

						that.active = true;

						// stops the proccess
						//return false;
						return {
							"status": false,
							"condition": condition,
							"msg": conditions[condition].message
						}
					};
				}
			}

			// Status OK (with previous error)
			if (that.active || !that.enabled) {
				// Public status OK
				that.active = false;
			}

			/**
			* Triggers when the validation process ends.
			* @name ch.Validator#afterValidate
			* @event
			* @public
			* @exampleDescription
			* @example
			* widget.on("afterValidate",function(){
			*	submitButton.disable();
			* });
			*/
			// old callback system
			that.callbacks('afterValidate');
			// new callback
			that.trigger("afterValidate");

			// It's all good ;)
			//return true;
			return {
				"status": true
			}
		}

		/**
		* Test a condition looking for error.
		* @private
		* @name ch.Validator#test
		* @see ch.Condition
		*/
		var test = function(condition, value){

			if (value === "" && condition !== "required") { return true };

			var isOk = false,
				// this is the validation
				validation = this || window,
				condition = conditions[condition];

			isOk = condition.test.call(validation, value);

			return isOk;

		};

	/**
	* Protected Members
	*/

		/**
		* Flag that let you know if there's a validation going on.
		* @protected
		* @name ch.Validator#active
		* @type boolean
		*/
		that.active = false;

		/**
		* Flag that let you know if the all conditions are enabled or not.
		* @protected
		* @name ch.Validator#enabled
		* @type boolean
		*/
		that.enabled = true;

	/**
	*	Public Members
	*/

		/**
		* @borrows ch.Object#uid as ch.TabNavigator#uid
		*/

		/**
		* This public property defines the component type. All instances are saved into a 'map', grouped by its type. You can reach for any or all of the components from a specific type with 'ch.instances'.
		* @public
		* @name ch.Validator#type
		* @type String
		*/
		that["public"].type = "validator";

		/**
		* This public Map saves all the validation configurations from this instance.
		* @public
		* @name ch.Validator#conditions
		* @type object
		*/
		that["public"].conditions = conditions;

		/**
		* Active is a boolean property that let you know if there's a validation going on.
		* @public
		* @function
		* @name ch.Validator#isActive
		* @returns itself
		*/
		that["public"].isActive = function() {
			return that.active;
		};

		/**
		* Let you keep chaining methods.
		* @public
		* @function
		* @name ch.Validator#and
		* @returns itself
		*/
		that["public"].and = function(){
			return that.$element;
		};

		/**
		* Merge its conditions with a new conditions of another instance with the same trigger.
		* @public
		* @function
		* @name ch.Validator#extend
		* @returns itself
		*/
		that["public"].extend = function(input){
			$.extend(conditions, input);

			return that["public"];
		};

		/**
		* Clear all active validations.
		* @public
		* @function
		* @name ch.Validator#clear
		* @returns itself
		*/
		that["public"].clear = function() {
			that.active = false;

			return that["public"];
		};

		/**
		* Runs all configured conditions and returns an object with a status value, condition name and a message.
		* @public
		* @function
		* @name ch.Validator#validate
		* @returns Status Object
		*/
		that["public"].validate = function(value){
			// this is the validation
			return validate.call(this, value);
		}

		/**
		* Turn on Validator engine or an specific condition.
		* @public
		* @name enable
		* @name ch.Validator#enable
		* @returns itself
		*/
		that["public"].enable = function(condition){
			if (condition && conditions[condition]){
				// Enable specific condition
				conditions[condition].enable();
			} else {
				// enable all
				that.enabled = true;
				for (condition in conditions){
					conditions[condition].enable();
				}
			}
			return that["public"];
		}

		/**
		* Turn on Validator engine or an specific condition.
		* @public
		* @name disable
		* @name ch.Validator#disable
		* @returns itself
		*/
		that["public"].disable = function(condition){
			if (condition && conditions[condition]){
				// disable specific condition
				conditions[condition].disable();
			} else {
				// disable all
				that.enabled = false;
				for (condition in conditions){
					conditions[condition].disable();
				}
			}
			return that["public"];
		}

	/**
	*	Default event delegation
	*/
		/**
		* Triggers when the component is ready to use.
		* @name ch.Validator#ready
		* @event
		* @public
		* @exampleDescription Following the first example, using <code>widget</code> as modal's instance controller:
		* @example
		* widget.on("ready",function(){
		*	this.show();
		* });
		*/
		that.trigger("ready");

		return that;
	};

	Validator.prototype.name = 'validator';
	Validator.prototype.constructor = Validator;

	ch.factory(Validator);

}(this, this.jQuery, this.ch));