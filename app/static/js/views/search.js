define([
    'jquery',
    'underscore',
    'backbone',
    'views/base',
    'text!../../templates/search.html',
    'views/search/query_input',
    'views/search/query_properties',
    'views/search/timeslider',
    'views/search/results_list',
    'views/search/paginator',
    'views/search/facets'
],
function($, _, Backbone, BaseView, searchTemplate, QueryInputView, QueryPropertiesView,
         TimeSliderView, ResultsListView, PaginatorView, FacetsView){
    var SearchView = Backbone.View.extend({
        initialize: function(options){
            this.constructor.__super__.initialize.apply(this, [options]);
            this.name = this.options.name;
            this.query_input = new QueryInputView({ model: this.model });
            this.timeslider = new TimeSliderView({
                model: this.model,
                date_facet: DEFAULT_DATE_FACET
            });

            // Initialize subviews
            this.results_list = new ResultsListView({ model: this.model });
            this.query_properties = new QueryPropertiesView({ model: this.model });
            this.paginator = new PaginatorView({ model: this.model });
        },

        render: function(){
            var compiledTemplate = _.template(searchTemplate, {});
            this.$el.html(compiledTemplate);

            // Setup all subviews
            this.query_input.setElement($('.query-input.' + this.name)).render();
            this.query_properties.setElement($('.query-properties.' + this.name)).render();
            this.timeslider.setElement($('.timeslider.' + this.name)).render().toggleVisibility();
            this.results_list.setElement($('.hits.' + this.name)).render().toggleVisibility();
            this.paginator.setElement($('.pagination.' + this.name)).render();
        }
    });

    return SearchView;
});