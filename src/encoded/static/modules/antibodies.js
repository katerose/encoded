define(['exports', 'jquery', 'underscore', 'base', 'table_sorter', 'table_filter',
    'text!templates/sort_filter_table.html',
    'text!templates/antibodies/item.html',
    'text!templates/antibodies/row.html',
    'text!templates/antibodies/validation.html'],
function antibodies(exports, $, _, base, table_sorter, table_filter, home_template, item_template, row_template, validation_template) {

    exports.antibody_factory = function antibody_factory(attrs, options) {
        var new_obj = new base.Model(attrs, options);
        new_obj.url = '/antibodies/' + options.route_args[0];
        return new_obj;
    };

    var AntibodyCollection = exports.AntibodyCollection = base.Collection.extend({

        model: base.Model,
        url: '/antibodies/'
    });

    // The antibodies home screen
    var AntibodiesHomeView = exports.AntibodiesHomeView = base.TableView.extend({
        template: _.template(home_template),
        row_template: _.template(row_template),
        table_header: [ 'Accession',
                        'Target',
                        'Species',
                        'Source',
                        'Product ID',
                        'Lot ID',
                        'Validations',
                        'Status'
                       ],
        sort_initial: 1  // oh the index hack it burns

    }, {
        route_name: 'antibodies',
        model_factory: exports.AntibodyCollection
    });

    exports.ValidationView = base.View.extend({
        tagName: 'section',
        attributes: {'class': 'type-validation view-detail panel'},
        initialize: function initialize(options) {
            var model = options.model;
            this.deferred = model.deferred;
        },
        update: function update() {
            var status = this.model.get('validation_status');
            if (status) {
                this.$el.addClass('status-' + status.toLowerCase());
            }
        },
        template: _.template(validation_template)
    });

    var AntibodyView = exports.AntibodyView = base.View.extend({
        attributes: {'class': 'type-antibody_approval view-detail'},
        validation: exports.ValidationView,
        initialize: function initialize(options) {
            var model = options.model,
                deferred = $.Deferred();
            this.deferred = deferred;
            model.deferred = model.fetch();
            $.when(model.deferred).done(_.bind(function () {
                this.validations = _.map(model.links.validations, _.bind(function (item) {
                    item.deferred = item.fetch();
                    var subview = new this.validation({model: item});
                    $.when(subview.deferred).then(function () {
                        subview.render();
                    });
                    return subview;
                }, this));
                $.when.apply($, _.pluck(this.validations, 'deferred')).then(function () {
                    deferred.resolve();
                });
            }, this));
            // XXX .fail(...)
        },
        template: _.template(item_template),
        update: function update() {
            var source = this.model.links.antibody_lot.links.source,
                title = source.get('source_name') + ' - ' + source.get('product_id'),
                lot_id = source.get('lot_id');
            if (lot_id) title += ' - ' + lot_id;
            this.title = title;
            var status = this.model.get('approval_status');
            if (status) {
                this.$el.addClass('status-' + status.toLowerCase());
            }
        },
        render: function render() {
            AntibodyView.__super__.render.apply(this, arguments);
            var div = this.$el.find('div.validations');
            _.each(this.validations, function (view) {
                div.append(view.el);
            });
            return this;
        }
    }, {
        route_name: 'antibody',
        model_factory: exports.antibody_factory
    });

    var antibodyAddOverlay = exports.antibodyAddOverlay = base.Modal.extend({
        tagName: 'form',
        events: {'submit': 'submit'},
        className: base.Modal.prototype.className + ' form-horizontal',
        initialize: function initialize(options) {
            var name = options.route_args[0];
            this.action = _.find(this.model._links.actions, function(item) {
                return item.name === name;
            });
            this.title = this.action.title;
            this.deferred = $.get(this.action.profile);
            this.deferred.done(_.bind(function (data) {
                this.schema = data;
            }, this));
        },
        render: function render() {
            antibodyAddOverlay.__super__.render.apply(this, arguments);
            this.form = this.$('.modal-body').jsonForm({
                schema: this.schema,
                form: _.without(_.keys(this.schema.properties), ''),
                submitEvent: false,
                onSubmitValid: _.bind(this.send, this)
            });
            setTimeout(function() {
                var lotId = document.getElementsByName("antibody_lot_id")[0].id;
                $("#" + lotId).chosen(); 
                $.ajax({
                    async: false,
                    url: "/get_data",
                    dataType: "json",
                    data: {collection: 'antibody_lots', column: 'lot'},
                    success:  function(lots) {
                        _.each(lots, function(value, key) {
                            if (value != 'Unknown') {
                                $("#" + lotId).append('<option value = ' + key + '>' + value + '</option>');
                            }
                        });
                   }
                });
                $("#"+ lotId).trigger('liszt:updated');
                var productId = document.getElementsByName("antibody_product_id")[0].id;
                $("#" + productId).chosen();
                $.ajax({
                    async: false,
                    url: "/get_data",
                    dataType: "json",
                    data: {collection: 'antibody_lots', column: 'product'},
                    success:  function(products) {
                        _.each(products, function(value, key) {
                            $("#" + productId).append('<option value = ' + key + '>' + value + '</option>');
                        });
                   }
                });
                $("#"+ productId).trigger('liszt:updated');
                var targetId = document.getElementsByName("target_uuid")[0].id;
                $("#" + targetId).chosen();
                $.ajax({
                    async: false,
                    url: "/get_data",
                    dataType: "json",
                    data: {collection: 'target'},
                    success:  function(targets) {
                        _.each(targets, function(value, key) {
                            $("#" + targetId).append('<option value = ' + value + '>' + value + '</option>');
                        });
                   }
                });
                $("#"+ targetId).trigger('liszt:updated');
                var speciesId = document.getElementsByName("host_organism")[0].id;
                $("#" + speciesId).chosen();
                var sourceId = document.getElementsByName("source_uuid")[0].id;
                $("#" + sourceId).chosen();
                $.ajax({
                    async: false,
                    url: "/get_data",
                    dataType: "json",
                    data: {collection: 'source'},
                    success:  function(sources) {
                        _.each(sources, function(value, key) {
                            $("#" + document.getElementsByName("source_uuid")[0].id).append('<option value = ' + key + '>' + value + '</option>');
                        });
                   }
                });
                $("#"+ sourceId).trigger('liszt:updated');
            }, 1);
            return this;
        },
        submit: function submit(evt) {
            this.form.submit(evt);
        },
        send: function send(value)  {
            this.value = value;
            this.model.sync(null, this.model, {
                url: this.action.href,
                type: this.action.method,
                contentType: 'application/json',
                data: JSON.stringify(value),
                dataType: 'json'
            }).done(_.bind(function (data) {
                // close, refresh
                console.log(data);
                var url = data._links.items[0].href;
                // force a refresh
                app.view_registry.history.path = null;
                app.view_registry.history.navigate(url, {trigger: true});
            }, this)).fail(_.bind(function (data) {
                // flag errors, try again
                console.log(data);
            }, this));
            // Stop event propogation
            return false;
        }
    }, {
        route_name: 'add-antibody',
        model_factory: function model_factory(attrs, options) {
            return app.view_registry.current_views.content.model;
        }
    });

    return exports;
});
