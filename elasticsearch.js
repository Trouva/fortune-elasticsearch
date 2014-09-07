'use strict';

var _ = require('lodash');
var Bluebird = require('bluebird');
var config = require('../../server/configs/config'); // TODO: get baseURL another way
var inflect = require('i')();

// Inspired by fortune.js
var JSONApiElasticsearch = {

    options: {
        baseUrl: config.serverAddr,
        inflect: true,
        namespace: 'api/v2',
        publicNamespace: 'api/v2/public',
    },

    /**
     * [deserialize From db -> response]
     * @param  {[type]} model    [description]
     * @param  {[type]} resource [description]
     * @return {[type]}          [description]
     */
    deserialize: function(opts){

        var resource = opts.resource;
        var relations = _.map(opts.relations, 'type');
        var json = resource;
        var links = {};

        if (!relations.length) return json; // if empty

        // let's keep to _id s now!!
        json._id = resource._id;

        _.each(relations, function (relation) {

            if (_.isArray(json[relation])) {
                // If array, then wrap id in object
                links[relation] = json[relation].map(function(obj) {
                    var id = _.isPlainObject(obj) ? obj._id : obj;
                    return { _id : id};
                });

            } else if(json[relation] && ObjectID.isValid(json[relation])) {
                // if plain ObjectID
                links[relation] = { _id : json[relation] };
            } else if(json[relation + '_id']) {
                // i.e. product_id for products
                links[relation] = {_id: json[relation + '_id']};
                delete json[relation + '_id'];
            }

            delete json[relation];
        });

        if (_.keys(links).length) {
            json.links = links;
        }

        return json;
    },

    /*
    * Append a top level "links" object for hypermedia.
    *
    * @api private
    * @param {Object} body deserialized response body
    * @return {Object}
    */
    appendLinks: function(opts) {

        var self = this;
        var options = this.options;
        var relations = opts.relations;
        var body = opts.response;

        _.each(body, function (value, key) {
            if (key === 'meta') return;

            var associations = self.getAssociations.call(self, relations);

            if (!associations.length) return;
            body.links = body.links || {};

            associations.forEach(function (association) {
                var name = [key, association.key].join('.');
                var namespace = options.namespace;

                if(body.meta && _.contains(body.meta.indexed, association.type)) namespace = options.publicNamespace;

                body.links[name] = {
                    href: options.baseUrl + '/' +
                    (!!namespace ? namespace + '/' : '') +
                    association.type + '/{' + name + '}',
                    type: association.type
                };
            });

        });
        return body;
    },


    /*
    * Get associations from the relationship array.
    *
    * @api private
    * @param {Object} relationships
    * @return {Array}
    */
    getAssociations: function (relations) {
        var self = this;
        var associations = [];
        var options = self.options;

        relations.forEach(function(relation) {
            var key = relation.type;
            var type = options.inflect ? inflect.pluralize(key) : key;

            associations.push({
                key: key,
                type: type,
                singular: relation.singular
            });

        });

        return associations;
    },

};


module.exports = JSONApiElasticsearch;
