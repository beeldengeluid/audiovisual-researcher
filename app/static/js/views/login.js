define([
    'jquery',
    'underscore',
    'backbone',
    'app',
    'text!../../templates/login.html'
],
function($, _, Backbone, app, loginTemplate){
    var LoginView = Backbone.View.extend({
        parent: $('body'),
        id: 'login',

        events: {
            'submit #loginform': 'submitLogin'
        },

        initialize: function(){
            this.el = $(this.el);
            this.parent.append(this.el);

            app.vent.on('AvrApiModel:login_failed', this.loginFailed, this);
            app.vent.on('AvrApiModel:login_successful', this.loginSuccessful, this);
        },

        render: function(){
            this.$el.html(_.template(loginTemplate));
            this.$el.find('#loginmodal').modal({
                keyboard: false,
                backdrop: 'static',
                show: true
            });

            var self = this;
            this.$el.find('#loginmodal').on('shown', function(){
                self.$el.find('input[name="email"]').focus();
            });

            return this;
        },

        submitLogin: function(event){
            event.preventDefault();

            var email = this.$el.find('input[name="email"]').val();
            var password = this.$el.find('input[name="password"]').val();

            var self = this;
            this.$el.find('#userinput').fadeOut('fast', function(){
                self.$el.find('.loading').fadeIn();
                self.model.login(email, password);
            });
        },

        loginFailed: function(errors){
            var self = this;
            var error_div = this.$el.find('.errors');
            var error_list = error_div.find('ul');

            // Empty the current list of errors
            error_list.empty();

            // Append errors to the list
            _.each(errors, function(error){
                error_list.append('<li>' + error + '</li>');
            });

            error_div.show();

            this.$el.find('.loading').fadeOut('fast', function(){
                self.$el.find('#userinput').fadeIn();
            });
        },

        loginSuccessful: function(){
            app.router.navigate('', {trigger: true});

            this.remove();
        },

        remove: function(){
            if (DEBUG) console.log('LoginView:remove');

            this.$el.find('#loginmodal').modal('hide');

            app.vent.off('AvrApiModel:login_failed', this.loginFailed, this);
            app.vent.off('AvrApiModel:login_successful', this.loginSuccessful, this);
            this.unbind();

            Backbone.View.prototype.remove.call(this);
        }
    });

    return LoginView;
});