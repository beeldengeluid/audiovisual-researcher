define([
    'jquery',
    'underscore',
    'backbone',
    'app',
    'text!../../../templates/search/paginator.html'
],
function($, _, Backbone, app, paginatorTemplate){
    var PaginatorView = Backbone.View.extend({
        events: {
            'click a': 'paginate'
        },

        initialize: function(){
            this.model.on('change:hits', this.render, this);
        },

        pageCount: function(){
            if(this.model.get('totalHits') === undefined){
                return 0;
            }

            return Math.ceil(this.model.get('totalHits') / this.model.get('hitsPerPage'));
        },

        render: function(){
            if (DEBUG) console.log('PaginatorView:render');

            var total_pages = this.pageCount();
            var page_links = [];

            // Immidiatly render the pagination if there is only one page
            if(total_pages === 1){
                this.$el.html(_.template(paginatorTemplate, {
                    currentPage: this.model.get('currentPage'),
                    totalPages: total_pages,
                    pages: page_links
                }));

                return;
            }

            // The max. number of links to display before and after
            // the currently active page
            var max_links = 3;
            var links_added = 0;

            for(var i = this.model.get('currentPage') - 1; i >= 1; i--){
                if(links_added == max_links) break;
                page_links.unshift(i);
                links_added++;
            }

            page_links.push(this.model.get('currentPage'));

            links_added = 0;
            for(var i = this.model.get('currentPage') + 1; i <= total_pages; i++){
                if(links_added == max_links) break;

                page_links.push(i);
                links_added++;
            }

            this.$el.html(_.template(paginatorTemplate, {
                currentPage: this.model.get('currentPage'),
                totalPages: total_pages,
                pages: page_links
            }));
        },

        paginate: function(e){
            e.preventDefault();
            var paginateTo = parseInt($(e.currentTarget).data('page'), 10);
            if (DEBUG) console.log('PaginatorView:paginate To page', paginateTo);

            if(paginateTo == this.model.get('currentPage')) return;

            app.vent.trigger('Logging:clicks', {
                action: 'paginate',
                from: this.model.get('currentPage'),
                to: paginateTo,
                modelName: this.model.get('name')
            });

            this.model.set('currentPage', paginateTo);
            this.model.paginateToPage(paginateTo);
        }
    });

    return PaginatorView;
});
