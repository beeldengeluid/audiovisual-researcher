define([
    'jquery',
    'underscore',
    'backbone',
    'd3',
    'app',
    'views/search/cloud',
    'views/search/barchart',
    'text!../../../templates/search/facets.html'
],
function($, _, Backbone, d3, app, CloudView, BarChartView, facetsTemplate){
    var FacetsView = Backbone.View.extend({
        events: {
            'click a.nav-tab': 'switchTab',
            'click ul.nav i': 'swithFacetRepresentation'
        },

        initialize: function(options){
            if (DEBUG) console.log('FacetsView:initialize');
            // this.faceted = { q1: false, q2: false },
            var self = this;

            this.facets = {};
            this.faceted = {};

            this.clouds = {};
            this.barcharts = {};

            this.selectedFacets = {},
            this.activeTab = DEFAULT_FACETS[0],

            this.representation = 'clouds';
            this.models = options.models;

            // Control visibility on init. Element is shown on first query.
            this.is_visible = true;
            app.vent.once('QueryInput:input', this.toggleVisibility, this);

            _.each(this.models, function(model, modelName){
                self.clouds[modelName] = new CloudView({
                    model: model,
                    name: modelName
                });
                self.barcharts[modelName] = new BarChartView({
                    model: model,
                    name: modelName
                });
            });

            _.each(this.models, function(model, modelName){
                model.on('change:facets', self.formatData, self);
            });

            _.each(DEFAULT_FACETS, function(facet){
                self.facets[facet] = {name: AVAILABLE_FACETS[facet].name};
            });
        },

        render: function(icon){
            if (DEBUG) console.log('FacetsView:render');
            var self = this;

            this.$el.html(_.template(facetsTemplate, {
                facets: this.facets,
                activeTab: this.activeTab,
                representation: this.representation
            }));

            _.each(this.models, function(model, modelName){
                var tab = self[self.representation][modelName];
                tab.setElement(self.$el.find('div.tab-' + self.activeTab + ' div.' + modelName)).render(self.activeTab);
            });

            // Make sure the cloud boxes of Q1 and Q2 are of equal height
            var height = 0;
            this.$el.find('.tab-' + this.activeTab + ' .cloud').each(function(){
                var el_height = $(this).height();
                if(el_height > height){
                    height = el_height;
                }
            });
            this.$el.find('.tab-' + this.activeTab + ' .cloud').height(height);

            return this;
        },

        swithFacetRepresentation: function(event){
            if (DEBUG) console.log('FacetsView:swithFacetRepresentation');
            var self = this;

            var clicked_rep = $(event.target);

            // Do nothing if we are already showing this representation
            if(clicked_rep.data('representation') == this.representation){
                return;
            }

            this.representation = clicked_rep.data('representation');
            this.render();
        },

        formatData: function(){
            if (DEBUG) console.log('FacetsView:formatData');
            var self = this;
            var facets = {};

            _.each(DEFAULT_FACETS, function(facet){
                facets[facet] = {};
                _.each(self.models, function(model){
                    if(model.get('facets')){
                        facets[facet][model.get('name')] = {};
                        _.each(model.get('facets')[facet].terms, function(term){
                            facets[facet][model.get('name')][term.term] = term.count;
                        });
                    }
                });
                if(_.keys(facets[facet]).length > 1){ // there is data for both search boxes
                    self.facets[facet]['data'] = {
                        // 'combined': {'terms': {}, totalCount: 0, maxCount: -Infinity},
                        'q1': {'terms': {}, totalCount: 0, maxCount: -Infinity},
                        'q2': {'terms': {}, totalCount: 0, maxCount: -Infinity}
                    };
                    var q1Facets = facets[facet].q1;
                    var q2Facets = facets[facet].q2;

                    _.each(q1Facets, function(count, term){
                        self.facets[facet].data.q1.terms[term] = count;
                        self.facets[facet].data.q1.totalCount += count;
                        if(q1Facets[term] > self.facets[facet].data.q1.maxCount) self.facets[facet].data.q1.maxCount = count;
                    });

                    _.each(q2Facets, function(count, term){
                        self.facets[facet].data.q2.terms[term] = count;
                        self.facets[facet].data.q2.totalCount += count;
                        if(q2Facets[term] > self.facets[facet].data.q2.maxCount) self.facets[facet].data.q2.maxCount = count;
                    });

                    // sum of facet counts
                    self.facets[facet].sumOfCounts = _.reduce(
                            _.values(
                                self.facets[facet].data
                            ).map(function(f){
                                return f.totalCount;
                            }), function(memo, num){
                                return memo + num;
                            }, 0); // zero is the initial state of the reduction (i.e. memo)
                }
                else {
                    var query_id = _.keys(facets[facet])[0];
                    self.facets[facet].data = {};
                    var totalCount = _.reduce(_.values(_.values(facets[facet])[0]), function(memo, num){ return memo + num; }, 0);
                    self.facets[facet].data[query_id] = {terms:
                        facets[facet][query_id],
                        totalCount: totalCount
                    };
                    self.facets[facet].sumOfCounts = totalCount;
                }
            });

            this.render();
        },

        switchTab: function(e){
            e.preventDefault();
            var self = this;
            // if(this.barchart){
            //     this.swithFacetRepresentation(e, true);
            // }

            var targetTab = $(e.currentTarget).data('target');

            if (DEBUG) console.log('FacetsView:switchTab Switch to \"' + targetTab + '\"');
            app.vent.trigger('Logging:clicks', {
                action: 'change_facet_tab',
                fromTab: this.activeTab,
                toTab: targetTab
            });

            // Switch the active tab
            this.$el.find('a[data-target="' + targetTab + '"]').tab('show');
            // Set the active tab
            this.activeTab = targetTab;

            // Switch to the correct tab content
            this.$el.find('.tab-pane.active').removeClass('active');
            this.$el.find('.tab-' + targetTab).addClass('active');

            // Render content
            this.render();
        },

        toggleVisibility: function(){
            if (DEBUG) console.log('FacetsView:toggleVisibility');

            if(this.is_visible){
                this.$el.hide();
                this.is_visible = false;
            }
            else {
                this.$el.show();
                this.is_visible = true;
            }

            return this;
        }
    });

    return FacetsView;
});
