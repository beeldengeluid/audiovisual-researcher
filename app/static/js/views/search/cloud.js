define([
    'jquery',
    'underscore',
    'backbone',
    'd3',
    'app',
    'text!../../../templates/search/cloud.html'
], function($, _, Backbone, d3, app, cloudTemplate){
    var FacetView = Backbone.View.extend({

        events: {
            'click a.facet': 'filterOnFacet'
        },

        initialize: function(options){
            if (DEBUG) console.log('CloudView:' + options.name + ':initialize');
            var self = this;
            this.modelName = options.name;

            this.selectedFacets = {},
            this.faceted = false,

            this.fontSizeScale = d3.scale.linear()
                .range([
                    MINIMUM_CLOUD_FONTSIZE,
                    MAXIMUM_CLOUD_FONTSIZE
                ]);

            app.vent.on('QueryInput:input:' + this.modelName, function(){
                _.each(DEFAULT_FACETS, function(facet){
                    // Reset selected facet values when the search button is clicked
                    self.selectedFacets[facet].length = 0;
                });
            });

            _.each(DEFAULT_FACETS, function(facet){
                self.selectedFacets[facet] = [];
            });
        },

        render: function(tab){
            if (DEBUG) console.log('CloudView:' + this.modelName + ':render');

            var facetValues = this.model.get('facets');
            if(facetValues){
                this.fontSizeScale.domain(
                    d3.extent(facetValues[tab].terms, function(d){
                        return d.count;
                    })
                );
                this.$el.html(_.template(cloudTemplate, {
                    facetName: tab,
                    modelName: this.modelName,
                    scale: this.fontSizeScale,
                    terms: facetValues[tab].terms,
                    selectedFacets: this.selectedFacets,
                    faceted: this.faceted
                }));
            }

            this.$el.find('div.cloud a.facet').tooltip({
                placement: 'right'
            });

            return this;
        },

        filterOnFacet: function(e){
            e.preventDefault();
            var facet_value_el = $(e.target);
            var model = facet_value_el.data('model');
            var facet = facet_value_el.data('facet');
            var value = facet_value_el.data('value');

            var selected = facet_value_el.hasClass('selected');

            app.vent.trigger('Logging:clicks', {
                action: 'select_facet_value',
                query_instance: model,
                facet: facet,
                facet_value: value,
                value: selected ? false : true
            });

            if (!(this.faceted)){
                this.faceted = true;
            }

            if(selected){
                this.selectedFacets[facet].splice(
                    this.selectedFacets[facet].indexOf(value), 1
                );

                this.model.modifyFacetFilter(facet, value, false);
            }
            else {
                this.selectedFacets[facet].push(value);
                this.model.modifyFacetFilter(facet, value, true);
            }
        }
    });

    return FacetView;
});
