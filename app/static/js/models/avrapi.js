define([
    'jquery',
    'underscore',
    'backbone',
    'app'
],
function($, _, Backbone, app){
    AvrApiModel = Backbone.Model.extend({
        defaults: function(){
            return {
                enabledSearchFields: AVAILABLE_SEARCH_FIELDS,
                enabledFacets: AVAILABLE_FACETS,
                enabledSearchHitFields: SEARCH_HIT_FIELDS,
                hitsPerPage: HITS_PER_PAGE,
                startAtHit: 0,
                currentPage: 1,
                highlightFragments: HIT_HIGHLIGHT_FRAGMENTS,
                highlightFragmentSize: HIT_HIGHLIGHT_FRAGMENT_SIZE,
                highlightFields: HIT_HIGHLIGHT_FIELDS,
                ftQuery: null,
                filters: {},
                currentPayload: { facets: {}},

                hits: {},
                totalHits: 0,
                queryTime: 0,
                queryTimeMs: null,

                // Total number of documents in the index
                totalDocs: 0,
                // First broadcast (broadcastDates.start) in the index
                firstBroadcastDate: null,
                // Most recent broadcast (broadcastDates.start) in the index
                lastBroadcastDate: null,
                // Number of broadcasts that contain one or more tweets
                docsWithTweetsCount: null,
                // Number of broadcasts that contain subtitles
                docsWithSubtitleCount: null,

                defaultInterval: AVAILABLE_FACETS.broadcast_start_date.date_histogram.interval,
                interval: null,

                user: USER
            };
        },

        initialize: function(){
            this.api_url = 'api/';

            var self = this;
            app.vent.on('QueryInput:input:' + this.get('name'), function(){
                self.set('minDate', Infinity);
                self.set('maxDate', -Infinity);
            });

            app.vent.on('interval:set', function(){
                self.setHistogram();
            });

            app.vent.on('QueryInput:input:' + this.get('name'), function(){
                self.set('interval', null);
            });
        },

        http: {
            get: function(url, data, callback){
                url = ['api', url].join('/');

                //if (DEBUG) console.log('AvrApiModel:http:post', url, payload);
                $.ajax({
                    url: url,
                    type: 'GET',
                    data: data,
                    dataType: 'json',
                    cache: true,
                    success: callback,
                    error: function(xhr, status, error){
                        console.log(xhr);
                        console.log(status);
                        console.log(error);
                    }
                });
            },
            post: function(url, data, callback){
                if($.inArray(url, ['search', 'count']) !== -1){
                    data = {'payload': JSON.stringify(data)};
                }
                else if(url === 'log_usage'){
                    data = {'events': JSON.stringify(data)};
                }

                url = ['api', url].join('/');

                //if (DEBUG) console.log('AvrApiModel:http:post', url, payload);
                $.ajax({
                    url: url,
                    type: 'POST',
                    data: data,
                    dataType: 'json',
                    cache: true,
                    success: callback,
                    error: function(xhr, status, error){
                        console.log(xhr);
                        console.log(status);
                        console.log(error);
                    }
                });
            }
        },

        register: function(email, name, organization, password){
            var post_data = {
                email: email,
                name: name,
                organization: organization,
                password: password
            };

            var self = this;

            // On successful login, set the user details and trigger 'login_successful' event
            this.http.post('register', post_data, function(data){
                if(data.success){
                    app.vent.trigger('AvrApiModel:registration_successful');
                }
                // Trigger 'login_failed' with the error
                else {
                    app.vent.trigger('AvrApiModel:registration_failed', data.errors);
                }
            });
        },

        login: function(email, password){
            var post_data = {
                email: email,
                password: password
            };

            var self = this;
            this.http.post('login', post_data, function(data){
                // On successful login, set the user details and trigger 'login_successful' event
                if(data.success){
                    self.set('user', data.user);
                    app.vent.trigger('AvrApiModel:login_successful');
                }
                // Trigger 'login_failed' with the error
                else {
                    app.vent.trigger('AvrApiModel:login_failed', data.errors);
                }
            });
        },

        logout: function(){
            var self = this;
            this.set('user', null);
            this.http.get('logout', function(data){
                console.log(data);
            });
        },

        logUsage: function(events){
            this.http.post('log_usage', events, function(data){
                console.log(data);
            });
        },

        // Use the query properties that are set as instance attributes to generate
        // an ES query
        constructQueryPayload: function(){
            var self = this;
            var payload = {
                query: {}
            };

            var filtered = {};
            // Construct the filtered free text query based on enabled sources/fields
            var enabledSources = this.get('enabledSearchFields');
            var ftQuery = this.get('ftQuery');
            filtered.query = {
                bool: {
                    should: [],
                    minimum_number_should_match : 1
                }
            };

            // First add non-nested fields as a single query_string query
            _.each(enabledSources, function(source){
                if(!('nested' in source)){
                    // Only add the query_string defention if the array is still empty
                    if(filtered.query.bool.should.length === 0){
                        filtered.query.bool.should.push({
                            query_string: {
                                fields: [],
                                query: ftQuery,
                                default_operator: 'AND'
                            }
                        });
                    }

                    _.each(source.fields, function(field){
                        filtered.query.bool.should[0].query_string.fields.push(field);
                    });
                }
            });

            // Add the fields of a nested document as a seperate 'should' to the bool
            // query. Each nested document is added as a seperate 'should'.
            _.each(enabledSources, function(source){
                if('nested' in source){
                    filtered.query.bool.should.push({
                        nested: {
                            path: source.nested,
                            query: {
                                query_string: {
                                    fields: source.fields,
                                    query: ftQuery,
                                    default_operator: 'AND'
                                }
                            }
                        }
                    });
                }
            });

            var filters = this.get('filters');

            // Only add the filter component to the query if at least one filter
            // is enabled.
            if(_.size(filters) > 0){
                // Each facet is added as an AND filter
                filtered.filter = {and: []};
            }

            _.each(filters, function(filter, facet_name){
                // Term based filtering on nested attributes
                if(filter.nested && filter.facet_type === 'terms'){
                    _.each(filter.values, function(value){
                        var facet = {};
                        facet.nested = {
                            path: filter.path,
                            // Take all nested documents of 'path' into consideration
                            query: {match_all: {}}
                        };

                        // facet_filters and facet values are added as AND conditions
                        facet.nested.filter = { and: []};

                        // Use the specified field when dealing with multi-field types
                        if('nested_filter_field' in filter){
                            field = filter.path + '.' + filter.nested_filter_field + '.' + filter.field;
                        }
                        else {
                            field = filter.path + '.' + filter.field;
                        }

                        var term_filter = {term : {}};
                        term_filter.term[field] = value;
                        facet.nested.filter.and.push(term_filter);

                        // Add additonal filters for nested docuent selection
                        if('facet_filter' in filter){
                            facet.nested.filter.and.push(filter.facet_filter);
                        }

                        filtered.filter.and.push(facet);
                    });
                }

                // Date range filter on nested attributes
                else if(filter.nested && filter.facet_type === 'range'){
                    var facet = {};
                    facet.nested = {
                        path: filter.path,
                        // Take all nested documents of 'path' into consideration
                        query: {match_all: {}}
                    };

                    // facet_filters and facet values are added as AND conditions
                    facet.nested.filter = { and: []};

                    // Use the specified field when dealing with multi-field types
                    if('nested_filter_field' in filter){
                        field = filter.path + '.' + filter.nested_filter_field + '.' + filter.field;
                    }
                    else {
                        field = filter.path + '.' + filter.field;
                    }

                    var range_filter = {};
                    range_filter[field] = {
                        'from': filter.values.from,
                        'to': filter.values.to
                    };

                    facet.nested.filter.and.push({'range': range_filter});

                    if('facet_filter' in filter){
                        facet.nested.filter.and.push(filter.facet_filter);
                    }

                    filtered.filter.and.push(facet);
                }

                // Term based filtering on non-nested attributes
                else if(filter.facet_type === 'terms'){
                    var facet = {};
                    field = filter.field;
                    values = filter.values;
                    facet.terms = {};
                    facet.terms[field] = values;
                    facet.terms.execution = 'and';

                    filtered.filter.and.push(facet);
                }
            });

            // Add the filters to the query payload
            payload.query.filtered = filtered;

            // Snippets and highlighting
            var highlight = {
                fields: {},
                number_of_fragments: this.get('highlightFragments'),
                fragment_size: this.get('highlightFragmentSize'),
                order: 'score'
            };

            _.each(this.get('highlightFields'), function(field){
                highlight.fields[field] = {};
            });
            payload.highlight = highlight;

            // Facets
            var facets = {};
            var enabled_facets = this.get('enabledFacets');
            // The facet settings we need and Elastic Search supports
            var es_facet_fields = ['date_histogram', 'terms', 'facet_filter', 'nested'];
             _.each(enabled_facets, function(facet, facet_name){
                facets[facet_name] = {};

                _.each(facet, function(option_value, option_name){
                    // Only add to payload if facet setting is supported by ES
                    if(_.contains(es_facet_fields, option_name)){
                        if(option_name === 'date_histogram'){
                            var interval = self.get('interval');
                            if(!interval) interval = self.get('defaultInterval');
                            option_value.interval = interval;
                        }
                        facets[facet_name][option_name] = option_value;
                    }
                });
            });
            payload.facets = facets;

            // The fields that are required to render the search results templates
            payload._source = this.get('enabledSearchHitFields');

            // Number of hits to return and the offset
            payload.size = this.get('hitsPerPage');
            payload.from = this.get('startAtHit');

            return payload;
        },

        changeSearchFields: function(enabled_fields){
            if (DEBUG) console.log('ElasticSearchModel:changeSearchFields', enabled_fields);

            var self = this;

            // Get the config definitions of the enabled fields
            var field_definitions = _.filter(AVAILABLE_SEARCH_FIELDS, function(field){
                if(_.contains(enabled_fields, field.id)){
                    return true;
                } else {
                    return false;
                }
            });

            this.set('enabledSearchFields', field_definitions);
            this.set('currentPayload', this.constructQueryPayload());

            this.http.post('search', this.get('currentPayload'), function(data){
                self.set({
                    hits: data.hits.hits,
                    facets: data.facets,
                    totalHits: data.hits.total,
                    queryTime: data.took,
                    queryTimeMs: (data.took / 1000).toFixed(2)
                });
            });
        },

        // Execute a new query based on an ft query string and the default
        // query properties defined in the config
        freeTextQuery: function(querystring){
            var self = this;

            // Reset query properties
            this.set({
                enabledFacets: AVAILABLE_FACETS,
                enabledSearchHitFields: SEARCH_HIT_FIELDS,
                hitsPerPage: HITS_PER_PAGE,
                startAtHit: 0,
                currentPage: 1,
                ftQuery: querystring,
                filters: {broadcast_start_date: {facet_type: "range", field: "start", nested: true, path: "broadcastDates", values: {from: new Date(1800,1,1), to: new Date()}}}
            });

            this.set('currentPayload', this.constructQueryPayload());
            this.http.post('search', this.get('currentPayload'), function(data){
                self.set({
                    hits: data.hits.hits,
                    facets: data.facets,
                    totalHits: data.hits.total,
                    queryTime: data.took,
                    queryTimeMs: (data.took / 1000).toFixed(2),
                    queryString: querystring
                });
            });
        },

        // Add or remove facet values from the set of active filters
        modifyFacetFilter: function(facet, value, add){
            var self = this;
            var facet_settings = AVAILABLE_FACETS[facet];

            // Get the currently active filters
            var filters = this.get('filters');

            // Add filter defenitions to the filters object if it does not yet exist
            if(!(facet in filters)){
                // Facet of the 'terms' type
                if('terms' in facet_settings){
                    filters[facet] = {
                        facet_type: 'terms',
                        field: facet_settings.terms.field,
                        values: []
                    };
                }
                else if ('date_histogram' in facet_settings){
                    filters[facet] = {
                        facet_type: 'range',
                        field: facet_settings.date_histogram.field,
                        values: {}
                    };
                }

                // Add required addtional info for 'nested' documents
                if('nested' in facet_settings){
                    filters[facet].nested = true;
                    filters[facet].path = facet_settings.nested;

                    // Additional filters that indicate which nested documents of 'path'
                    // should be taken into consideration
                    if('facet_filter' in facet_settings){
                        filters[facet].facet_filter = facet_settings.facet_filter;
                    }

                    // Use a specific field in case of a multi-field
                    if('nested_filter_field' in facet_settings){
                        filters[facet].nested_filter_field = facet_settings.nested_filter_field;
                    }
                }
            }

            // Add or delete a facet value from the filters values array
            if('terms' in facet_settings){
                if(add){
                    filters[facet].values.push(value);
                }
                else {
                    var index = filters[facet].values.indexOf(value);
                    filters[facet].values.splice(index, 1);
                    if(filters[facet].values.length === 0){
                        delete filters[facet];
                    }
                }
            }
            else if('date_histogram' in facet_settings){
                if(add){
                    filters[facet].values.from = value[0];
                    filters[facet].values.to = value[1];
                }
                else {
                    delete filters[facet];
                }
            }

            this.set('filters', filters);
            this.set('currentPayload', this.constructQueryPayload());
            this.http.post('search', this.get('currentPayload'), function(data){
                self.set({
                    hits: data.hits.hits,
                    facets: data.facets,
                    queryTime: data.took,
                    totalHits: data.hits.total,
                    queryTimeMs: (data.took / 1000).toFixed(2)
                });
            });
        },

        getDateHistogram: function(options, callback){
            var self = this;
            var interval = this.get('interval');
            if (!interval){
                interval = this.get('defaultInterval');
            }
            if(options.interval){
                interval = options.interval;
            }

            var payload = _.clone(this.get('currentPayload'));
            delete payload.highlight;
            payload.size = 0;
            payload.facets = {
                broadcast_start_date: {
                    date_histogram: {
                        field: 'start',
                        interval: interval
                    },
                    nested: 'broadcastDates'
                }
            };

            this.http.post('search', payload, function(data){
                callback(data);
            });
        },

        setHistogram: function(){
            if(!this.get('interval')){
                // No need to set a histogram
                return;
            }
            var self = this;
            var payload = _.clone(this.get('currentPayload'));

            delete payload.highlight;
            payload.size = 0;
            payload.facets = {
                broadcast_start_date: {
                    date_histogram: {
                        field: 'start',
                        interval: this.get('interval')
                    },
                    nested: 'broadcastDates'
                }
            };

            this.http.post('search', payload, function(data){
                var facets = self.get('facets');
                facets.broadcast_start_date = data.facets.broadcast_start_date;

                self.set({
                    facets: facets
                }, {silent: true});

                app.vent.trigger('model:redraw:' + self.get('name'));
            });
        },

        // Navigate to a given page using the existing query (currentPayload)
        paginateToPage: function(page){
            var self = this;
            this.set('startAtHit', this.get('hitsPerPage') * (page - 1));

            // Get a copy of the current payload
            var payload = this.get('currentPayload');
            payload.from = this.get('startAtHit');

            // Since we only have to replace hits, don't request facets. This is less
            // expensive on the ES side, and reduces the size of the response.
            delete payload.facets;

            this.http.post('search', payload, function(data){
                self.set({
                    hits: data.hits.hits,
                    queryTime: data.took,
                    queryTimeMs: (data.took / 1000).toFixed(2)
                });
            });
        },

        /* Get the total number of documents that are currently in the index */
        getTotalDocCount: function(){
            var self = this;
            this.http.post('count', {'query': {'match_all': {}}}, function(data){
                self.set('totalDocs', data.count);
            });
        },

        /* Get the date of the first and last broadcasts in the index */
        getFirstLastDocDates: function(){
            var self = this;

            var query = {
                "query": {"match_all": {}},
                "facets": {
                    "min_max_broadcast_start_date": {
                        "nested": "broadcastDates",
                        "statistical": {
                            "field": "start"
                        },
                        "facet_filter": {
                            "range": {
                                "broadcastDates.start": {
                                    "gte": new Date(1800,1,1),
                                    "lte": new Date()
                                }
                            }
                        }
                    }
                },
                "size": 0
            };
            this.http.post('search', query, function(data){
                self.set({
                    firstBroadcastDate: new Date(data.facets.min_max_broadcast_start_date.min),
                    lastBroadcastDate: new Date(data.facets.min_max_broadcast_start_date.max)
                });
            });
        },

        /* Get the number of documents that contain one or more Tweet */
        getDocsWithTweetsCount: function(){
            var self = this;
            var query = {
              "query": {
                "filtered": {
                  "query": { "match_all": {} },
                  "filter": {
                    "nested": {
                      "path": "tweets",
                      "query": { "match_all": {} },
                      "filter": {
                        "not": {
                          "missing": {
                            "field": "tweetId",
                            "existence": true
                          }
                        }
                      }
                    }
                  }
                }
              },
              "size": 0
            };

            this.http.post('search', query, function(data){
                self.set('docsWithTweetsCount', data.hits.total);
            });
        },

        getDocsWithSubtitleCount: function(){
            var self = this;
            var query = {
                "query": {
                    "filtered": {
                        "query": {
                            "match_all": {}
                        },
                        "filter": {
                            "exists": {
                                "field": "subtitles"
                            }
                        }
                    }
                },
                "size": 0
            };

            this.http.post('search', query, function(data){
                self.set('docsWithSubtitleCount', data.hits.total);
            });
        }
    });

    return AvrApiModel;
});
