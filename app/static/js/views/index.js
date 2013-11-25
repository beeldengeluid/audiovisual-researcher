define([
    'jquery',
    'underscore',
    'backbone',
    'views/base',
    'views/search',
    'views/search/timeseries',
    'views/search/facets',
    'text!../../templates/index.html',
    'models/avrapi'
],
function($, _, Backbone, BaseView, SearchView, TimeseriesView, FacetsView,
         indexTemplate, AvrApiModel){
    var IndexView = Backbone.View.extend({
        parent: $('#main'),
        id: 'search',

        initialize: function(options){
            this.el = $(this.el);
            this.parent.append(this.el);

            var query_model_1 = new AvrApiModel({ color: '#009fda', name: 'q1' });
            this.search_view_1 = new SearchView({
                name: 'q1',
                model: query_model_1
            });

            var query_model_2 = new AvrApiModel({ color: '#e00034', name: 'q2' });
            this.search_view_2 = new SearchView({
                name: 'q2',
                model: query_model_2
            });

            this.timeseries_view = new TimeseriesView({
                models: {
                    query1: query_model_1,
                    query2: query_model_2
                },
                // Element to use for width
                widthElement: '#timeseries',
                height: 280
            });

            this.facets_view = new FacetsView({
                models: {
                    q1: query_model_1,
                    q2: query_model_2
                }
            });
        },

        render: function(){
            var compiledTemplate = _.template(indexTemplate, {});
            this.$el.html(compiledTemplate);

            // Setup all subviews
            this.search_view_1.setElement(this.$el.find('#search_1')).render();
            this.search_view_2.setElement(this.$el.find('#search_2')).render();
            this.timeseries_view.setElement(this.$el.find('#timeseries')).render().toggleVisibility();
            this.facets_view.setElement(this.$el.find('#facets')).render().toggleVisibility();

            return this;
        }
    });

    return IndexView;
});
