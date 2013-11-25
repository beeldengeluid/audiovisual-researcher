define([
    'jquery',
    'underscore',
    'backbone',
    'app',
    'logging',
    'views/menu',
    'views/index',
    'views/about',
    'views/help',
    'views/login',
    'views/register',
    'models/avrapi'
],
function($, _, Backbone, app, Logging, MenuView, IndexView,
         AboutView, HelpView, LoginView, RegisterView, AvrApiModel){
    var Router = Backbone.Router.extend({
        routes: {
            '': 'index',
            'about': 'about',
            'help': 'help',
            'login': 'login',
            'logout': 'logout',
            'register': 'register'
        },

        initialize: function(){
            this.avrapi = new AvrApiModel();

            if(ENABLE_USAGE_LOGGING){
                app.logger = new Logging({ model: this.avrapi });
            }

            this.currentView = null;
            this.menu = new MenuView({ model: this.avrapi }).render();

            this.index_view = new IndexView();
            this.index_view.render().$el.hide();
        },

        index: function(){
            if (DEBUG) console.log('route:index');

            if(this.currentView){
                this.currentView.unbind();
                this.currentView.remove();
            }

            this.index_view.$el.show();
            this.menu.setActiveItem('#/');
        },

        login: function(){
            if (DEBUG) console.log('route:login');

            if(this.currentView){
                this.currentView.unbind();
                this.currentView.remove();
            }

            this.currentView = new LoginView({ model: this.avrapi }).render();
        },

        logout: function(){
            if (DEBUG) console.log('router:logout');

            this.avrapi.logout();
            this.navigate('#login', {trigger: true});
        },

        register: function(){
            if (DEBUG) console.log('route:register');

            if(this.currentView){
                this.currentView.unbind();
                this.currentView.remove();
            }

            this.currentView = new RegisterView({ model: this.avrapi }).render();
        },

        about: function(){
            if (DEBUG) console.log('route:about');

            if(this.currentView){
                this.currentView.unbind();
                this.currentView.remove();
            }

            this.index_view.$el.hide();

            var about = new AboutView({model: this.avrapi}).render();

            this.currentView = about;
            this.menu.setActiveItem('#/about');
        },

        help: function(){
            if (DEBUG) console.log('route:help');

            if(this.currentView){
                this.currentView.unbind();
                this.currentView.remove();
            }

            this.index_view.$el.hide();

            var querysyntax = new HelpView().render();

            this.currentView = querysyntax;
            this.menu.setActiveItem('#/help');
        }
    });

    return Router;
});
