define([
    'jquery',
    'underscore',
    'backbone',
    'app',
    'text!../../templates/register.html'
],
function($, _, Backbone, app, registerTemplate){
    var RegisterView = Backbone.View.extend({
        parent: $('body'),
        id: 'register',

        events: {
            'submit #registrationform': 'submitRegistration',
        },

        initialize: function(){
            this.el = $(this.el);
            this.parent.append(this.el);

            app.vent.on('AvrApiModel:registration_failed', this.registrationFailed, this);
            app.vent.on('AvrApiModel:registration_successful', this.registrationSuccess, this);
        },

        render: function(){
            this.$el.html(_.template(registerTemplate));
            this.$el.find('#registermodal').modal({
                keyboard: false,
                backdrop: 'static',
                show: true
            });

            var self = this;
            this.$el.find('#registermodal').on('shown', function(){
                self.$el.find('input[name="email"]').focus();
            });

            return this;
        },

        submitRegistration: function(event){
            event.preventDefault();

            var email = this.$el.find('input[name="email"]').val();
            var name = this.$el.find('input[name="name"]').val();
            var organization = this.$el.find('input[name="organization"]').val();
            var password = this.$el.find('input[name="password"]').val();

            var self = this;

            this.$el.find('#userinput').fadeOut('fast', function(){
                self.$el.find('.loading').fadeIn();
                self.model.register(email, name, organization, password);
            });
        },

        registrationFailed: function(errors){
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

        registrationSuccess: function(){
            var self = this;
            this.$el.find('.loading').fadeOut('fast', function(){
                self.$el.find('.modal-body').append('<div class="alert alert-success">You\'re almost done! Please follow the instructions in the email we\'ve just sent you to activate your account.</div>');
            });
        },

        remove: function(){
            if (DEBUG) console.log('RegisterView:remove');

            this.$el.find('#registermodal').modal('hide');

            app.vent.off('AvrApiModel:registration_failed', this.registrationFailed, this);
            app.vent.off('AvrApiModel:registration_successful', this.registrationSuccess, this);
            this.unbind();

            Backbone.View.prototype.remove.call(this);
        }
    });

    return RegisterView;
});
