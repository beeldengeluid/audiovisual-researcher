define([
    'jquery',
    'underscore',
    'backbone',
    'app',
    'text!../../../templates/search/query_input.html'
],
function($, _, Backbone, app, queryInputTemplate){
    var QueryInputView = Backbone.View.extend({
        events: {
            'submit': 'searchOnEnter',
            'click i': 'changeSearchFields'
        },

        render: function(){
            this.$el.html(_.template(queryInputTemplate, {
                searchFields: AVAILABLE_SEARCH_FIELDS
            }));

            this.$el.find('i').tooltip();
        },

        changeSearchFields: function(e){
            var available_fields = AVAILABLE_SEARCH_FIELDS;
            var checked_fields = [];

            // Depending on the current state of the clicked icon, switch it
            // to active or inactive
            $(e.target).toggleClass('active');

            app.vent.trigger('Logging:clicks', {
                action: 'change_search_field',
                modelName: this.model.get('name'),
                field: $(e.target).data('field'),
                value: $(e.target).hasClass('active')
            });

            this.$el.find('i.active').each(function(){
                checked_fields.push($(this).data('field'));
            });

            // If none of the fields are checked, re-check them all, and use all
            // fields for searching
            if(checked_fields.length === 0){
                if (DEBUG) console.log('QueryInputView:changeSearchFields User un-checked all fields, re-checking them');

                var fields = this.$el.find('i').addClass('active');
                fields.each(function(a){
                    checked_fields.push($(this).data('field'));
                });
            }

            this.model.changeSearchFields(checked_fields);
        },

        searchOnEnter: function(e){
            e.preventDefault();
            var querystring = this.$('input').val().trim();

            // Also log empty querystrings
            app.vent.trigger('Logging:clicks', {
                action: 'submit_query',
                modelName: this.model.get('name'),
                querystring: querystring
            });

            app.vent.trigger('QueryInput:input');
            app.vent.trigger('QueryInput:input:' + this.model.get('name'));

            // Only search if actual terms were entered
            if(!querystring){
                return;
            }

            this.model.freeTextQuery(querystring);
        }
    });

    return QueryInputView;
});
