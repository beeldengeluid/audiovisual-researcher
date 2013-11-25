define([
    'jquery',
    'underscore',
    'backbone',
    'app',
    'text!../../templates/menu.html'
],
function($, _, Backbone, app, menuTemplate){
    var MenuView = Backbone.View.extend({
        parent: $('#menu-container'),
        id: 'menu',
        className: 'nav-inner',
        events: {
            'click li a': 'logPageSwitch'
        },

        initialize: function(options){
            var self = this;

            this.el = $(this.el);
            this.parent.append(this.el);

            this.model.on('change:user', this.setActiveUser, this);

            this.active_item = null;
        },

        render: function(){
            if (DEBUG) console.log('MenuView:render');

            this.$el.html(_.template(menuTemplate));
            this.setActiveUser();

            return this;
        },

        setActiveItem: function(url){
            if(this.active_item){
                this.active_item.removeClass('active');
            }

            this.active_item = this.$el.find('a[href="' + url + '"]');
            this.active_item.addClass('active');
        },

        setActiveUser: function(){
            if (DEBUG) console.log('MenuView:setActiveUser');

            var user = this.model.get('user');
            var name = '';
            if(user){
                name = user.name;
            }
            this.$el.find('.username').html(name);
        },

        openItem: function(e){
            var clicked_link = $(e.target);

            // Return if an already active link is clicked
            if(clicked_link.hasClass('active')){
                return;
            }

            this.active_item.removeClass('active');
            clicked_link.addClass('active');
            this.active_item = clicked_link;
        },

        logPageSwitch: function(e){
            app.vent.trigger('Logging:clicks', {
                action: 'page_switch',
                fromPage: this.active_item[0].dataset.name,
                toPage: e.target.dataset.name
            });
        }
    });

    return MenuView;

});
